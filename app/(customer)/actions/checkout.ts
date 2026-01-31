"use server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import {
  formatAddressForGeocode,
  geocodeAddress,
  getDrivingDistanceKm,
} from "@/lib/openrouteservice";

export type AddressRecord = {
  id: number;
  type: string;
  name: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
};

async function getCustomerId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") throw new Error("Unauthorized");
  return parseInt(user.id, 10);
}

export async function getCustomerAddresses(): Promise<AddressRecord[]> {
  const customerId = await getCustomerId();
  const addresses = await prisma.address.findMany({
    where: {
      userId: customerId,
      type: { in: ["SHIPPING", "BILLING"] },
    },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return addresses.map((a) => ({
    id: a.id,
    type: a.type,
    name: a.name,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    country: a.country,
    pincode: a.pincode,
    isDefault: a.isDefault,
  }));
}

export type DeliveryChargeResult = {
  perVendor: {
    vendorId: number;
    vendorName: string;
    charge: number;
    distanceKm: number | null;
  }[];
  totalDeliveryCharge: number;
  error?: string;
};

export async function computeDeliveryCharges(
  deliveryAddressId: number,
): Promise<DeliveryChargeResult> {
  const customerId = await getCustomerId();

  const deliveryAddress = await prisma.address.findFirst({
    where: { id: deliveryAddressId, userId: customerId },
  });
  if (!deliveryAddress) {
    return {
      perVendor: [],
      totalDeliveryCharge: 0,
      error: "Address not found",
    };
  }

  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { vendor: true } },
            },
          },
        },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    return { perVendor: [], totalDeliveryCharge: 0 };
  }

  const vendorIds = [
    ...new Set(cart.items.map((i) => i.variant.product.vendorId)),
  ];
  const deliveryAddressString = formatAddressForGeocode(deliveryAddress);
  const destCoords = await geocodeAddress(deliveryAddressString);

  const perVendor: DeliveryChargeResult["perVendor"] = [];
  let totalDeliveryCharge = 0;

  for (const vendorId of vendorIds) {
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      include: {
        deliveryConfig: true,
        addresses: {
          where: { type: "PICKUP" },
          take: 1,
          orderBy: { isDefault: "desc" },
        },
      },
    });
    if (!vendor) continue;

    const config = vendor.deliveryConfig;
    const pickupAddress = vendor.addresses[0];

    if (!config?.isDeliveryEnabled || config.chargeType === "FREE") {
      perVendor.push({
        vendorId,
        vendorName: vendor.companyName ?? vendor.name,
        charge: 0,
        distanceKm: null,
      });
      continue;
    }

    let distanceKm: number | null = null;
    if (pickupAddress && destCoords) {
      const pickupString = formatAddressForGeocode(pickupAddress);
      const originCoords = await geocodeAddress(pickupString);
      if (originCoords) {
        distanceKm = await getDrivingDistanceKm(originCoords, destCoords);
      }
    }

    const subtotal = cart.items
      .filter((i) => i.variant.product.vendorId === vendorId)
      .reduce((s, i) => s + i.price * i.quantity, 0);

    let charge = 0;
    if (config.chargeType === "FLAT" && config.flatCharge != null) {
      charge =
        config.freeAboveAmount != null && subtotal >= config.freeAboveAmount
          ? 0
          : config.flatCharge;
    } else if (
      config.chargeType === "PER_KM" &&
      config.ratePerKm != null &&
      distanceKm != null
    ) {
      const cappedKm =
        config.maxDeliveryKm != null
          ? Math.min(distanceKm, config.maxDeliveryKm)
          : distanceKm;
      charge = cappedKm * config.ratePerKm;
      if (config.freeAboveAmount != null && subtotal >= config.freeAboveAmount)
        charge = 0;
    }

    const roundedCharge = Math.round(charge * 100) / 100;
    perVendor.push({
      vendorId,
      vendorName: vendor.companyName ?? vendor.name,
      charge: roundedCharge,
      distanceKm,
    });
    totalDeliveryCharge += roundedCharge;
  }

  return {
    perVendor,
    totalDeliveryCharge: Math.round(totalDeliveryCharge * 100) / 100,
  };
}

export async function saveAddress(data: {
  type: "SHIPPING" | "BILLING";
  name?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
}): Promise<{ success: boolean; addressId?: number; error?: string }> {
  try {
    const customerId = await getCustomerId();
    const address = await prisma.address.create({
      data: {
        userId: customerId,
        type: data.type,
        name: data.name ?? null,
        line1: data.line1,
        line2: data.line2 ?? null,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        isDefault: data.isDefault ?? false,
      },
    });
    return { success: true, addressId: address.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to save address",
    };
  }
}

export async function updateAddress(
  addressId: number,
  data: {
    name?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();
    await prisma.address.updateMany({
      where: { id: addressId, userId: customerId },
      data: {
        name: data.name ?? null,
        line1: data.line1,
        line2: data.line2 ?? null,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        isDefault: data.isDefault ?? false,
      },
    });
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update address",
    };
  }
}

export async function deleteAddress(
  addressId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();
    await prisma.address.deleteMany({
      where: { id: addressId, userId: customerId },
    });
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete address",
    };
  }
}
