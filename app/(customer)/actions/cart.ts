"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { computeRentalPrice } from "@/lib/cartPrice";

export type CartItemWithDetails = {
  id: number;
  variantId: number;
  quantity: number;
  rentalStart: Date;
  rentalEnd: Date;
  price: number;
  productName: string;
  variantSku: string | null;
  vendorId: number;
  vendorName: string;
  vendorCompanyName: string | null;
};

export type CartGroupedByVendor = {
  vendorId: number;
  vendorName: string;
  vendorCompanyName: string | null;
  items: CartItemWithDetails[];
  subtotal: number;
};

async function getCustomerId(): Promise<number> {
  const user = await getCurrentUser();


  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Unauthorized");
  }
  return parseInt(user.id, 10);
}

export async function getCart(): Promise<CartGroupedByVendor[]> {
  const customerId = await getCustomerId();

  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { vendor: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return [];
  }

  const byVendor = new Map<number, CartItemWithDetails[]>();

  for (const item of cart.items) {
    const v = item.variant;
    const product = v.product;
    const vendor = product.vendor;
    const row: CartItemWithDetails = {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      rentalStart: item.rentalStart,
      rentalEnd: item.rentalEnd,
      price: item.price,
      productName: product.name,
      variantSku: v.sku,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCompanyName: vendor.companyName,
    };
    const list = byVendor.get(vendor.id) ?? [];
    list.push(row);
    byVendor.set(vendor.id, list);
  }

  const result: CartGroupedByVendor[] = [];
  for (const [vendorId, items] of byVendor.entries()) {
    const first = items[0];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    result.push({
      vendorId,
      vendorName: first.vendorName,
      vendorCompanyName: first.vendorCompanyName,
      items,
      subtotal,
    });
  }

  return result;
}

export async function getCartCount(): Promise<number> {
  const customerId = await getCustomerId();
  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: { items: true },
  });
  if (!cart) return 0;
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

export async function addToCart(
  variantId: number,
  quantity: number,
  rentalStart: Date | string,
  rentalEnd: Date | string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();

    console.log(customerId, "CUSTMER ID");

    const start =
      typeof rentalStart === "string" ? new Date(rentalStart) : rentalStart;
    const end = typeof rentalEnd === "string" ? new Date(rentalEnd) : rentalEnd;
    if (end <= start) {
      return { success: false, error: "End date must be after start date" };
    }

    const pricePerUnit = await computeRentalPrice(variantId, start, end);
    if (pricePerUnit <= 0) {
      return {
        success: false,
        error: "Could not compute price for this period",
      };
    }

    let cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
      });
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId_rentalStart_rentalEnd: {
          cartId: cart.id,
          variantId,
          rentalStart: start,
          rentalEnd: end,
        },
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
          rentalStart: start,
          rentalEnd: end,
          price: pricePerUnit,
        },
      });
    }

    revalidatePath("/cart");
    revalidatePath("/products");
    revalidatePath("/products/[id]");
    return { success: true };
  } catch (e) {
    console.error("addToCart error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add to cart",
    };
  }
}

export async function removeCartItem(
  cartItemId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: { items: true },
    });
    if (!cart) return { success: false, error: "Cart not found" };
    const item = cart.items.find((i) => i.id === cartItemId);
    if (!item) return { success: false, error: "Item not found" };
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    revalidatePath("/cart");
    return { success: true };
  } catch (e) {
    console.error("removeCartItem error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to remove item",
    };
  }
}

export async function updateCartItemQuantity(
  cartItemId: number,
  quantity: number,
): Promise<{ success: boolean; error?: string }> {
  if (quantity < 1) return removeCartItem(cartItemId);
  try {
    const customerId = await getCustomerId();
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: { items: true },
    });
    if (!cart) return { success: false, error: "Cart not found" };
    const item = cart.items.find((i) => i.id === cartItemId);
    if (!item) return { success: false, error: "Item not found" };
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (e) {
    console.error("updateCartItemQuantity error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update quantity",
    };
  }
}

export type SubmitQuotationParams = {
  deliveryAddressId?: number | null;
  billingAddressId?: number | null;
  fulfillmentType: "STORE_PICKUP" | "DELIVERY";
  deliveryChargePerVendor?: Record<number, number>;
};

export async function submitQuotation(
  params?: SubmitQuotationParams
): Promise<{
  success: boolean;
  quotationIds?: number[];
  vendorNames?: string[];
  error?: string;
}> {
  try {
    const customerId = await getCustomerId();
    const fulfillmentType = params?.fulfillmentType ?? "DELIVERY";
    const deliveryChargePerVendor = params?.deliveryChargePerVendor ?? {};

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
      return { success: false, error: "Cart is empty" };
    }

    const byVendor = new Map<
      number,
      {
        vendorId: number;
        vendorName: string;
        items: {
          variantId: number;
          quantity: number;
          rentalStart: Date;
          rentalEnd: Date;
          price: number;
        }[];
      }
    >();

    for (const item of cart.items) {
      const vendor = item.variant.product.vendor;
      const vendorId = vendor.id;
      const list = byVendor.get(vendorId) ?? {
        vendorId,
        vendorName: vendor.companyName ?? vendor.name,
        items: [],
      };
      list.items.push({
        variantId: item.variantId,
        quantity: item.quantity,
        rentalStart: item.rentalStart,
        rentalEnd: item.rentalEnd,
        price: item.price,
      });
      byVendor.set(vendorId, list);
    }

    const quotationIds: number[] = [];
    const vendorNames: string[] = [];

    for (const { vendorId, vendorName, items } of byVendor.values()) {
      const deliveryCharge = fulfillmentType === "DELIVERY" ? (deliveryChargePerVendor[vendorId] ?? 0) : 0;
      const quotation = await prisma.quotation.create({
        data: {
          customerId,
          vendorId,
          status: "DRAFT",
          deliveryAddressId: params?.deliveryAddressId ?? undefined,
          billingAddressId: params?.billingAddressId ?? undefined,
          fulfillmentType,
          deliveryCharge,
        },
      });
      quotationIds.push(quotation.id);
      vendorNames.push(vendorName);
      await prisma.quotationItem.createMany({
        data: items.map((i) => ({
          quotationId: quotation.id,
          variantId: i.variantId,
          quantity: i.quantity,
          rentalStart: i.rentalStart,
          rentalEnd: i.rentalEnd,
          price: i.price,
        })),
      });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    revalidatePath("/cart");
    return { success: true, quotationIds, vendorNames };
  } catch (e) {
    console.error("submitQuotation error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to submit quotation",
    };
  }
}
