"use server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";

async function getCustomerId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") throw new Error("Unauthorized");
  return parseInt(user.id, 10);
}

export type QuotationListItem = {
  id: number;
  status: string;
  vendorName: string;
  vendorCompanyName: string | null;
  itemCount: number;
  deliveryCharge: number | null;
  fulfillmentType: string | null;
  createdAt: Date;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  totalAmount: number;
};

export type OrderListItem = {
  id: number;
  quotationId: number;
  status: string;
  vendorName: string;
  vendorCompanyName: string | null;
  itemCount: number;
  deliveryCharge: number;
  fulfillmentType: string;
  createdAt: Date;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  totalAmount: number;
};

export async function getCustomerQuotations(): Promise<QuotationListItem[]> {
  const customerId = await getCustomerId();
  const quotations = await prisma.quotation.findMany({
    where: { customerId },
    include: {
      vendor: { select: { name: true, companyName: true } },
      items: {
        include: { variant: { include: { product: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return quotations.map((q) => {
    const totalAmount = q.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryCharge = q.deliveryCharge ?? 0;
    const rentalStarts = q.items.map((i) => i.rentalStart);
    const rentalEnds = q.items.map((i) => i.rentalEnd);
    return {
      id: q.id,
      status: q.status,
      vendorName: q.vendor.name,
      vendorCompanyName: q.vendor.companyName,
      itemCount: q.items.length,
      deliveryCharge: q.deliveryCharge,
      fulfillmentType: q.fulfillmentType,
      createdAt: q.createdAt,
      rentalStart: rentalStarts.length > 0 ? new Date(Math.min(...rentalStarts.map((d) => d.getTime()))) : null,
      rentalEnd: rentalEnds.length > 0 ? new Date(Math.max(...rentalEnds.map((d) => d.getTime()))) : null,
      totalAmount: totalAmount + deliveryCharge,
    };
  });
}

export async function getCustomerOrders(): Promise<OrderListItem[]> {
  const customerId = await getCustomerId();
  const orders = await prisma.rentalOrder.findMany({
    where: { customerId },
    include: {
      quotation: {
        include: { vendor: { select: { name: true, companyName: true } } },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => {
    const totalAmount = o.items.reduce((s, i) => s + i.price * i.quantity, 0) + (o.deliveryCharge ?? 0);
    const rentalStarts = o.items.map((i) => i.rentalStart);
    const rentalEnds = o.items.map((i) => i.rentalEnd);
    return {
      id: o.id,
      quotationId: o.quotationId,
      status: o.status,
      vendorName: o.quotation.vendor.name,
      vendorCompanyName: o.quotation.vendor.companyName,
      itemCount: o.items.length,
      deliveryCharge: o.deliveryCharge ?? 0,
      fulfillmentType: o.fulfillmentType,
      createdAt: o.createdAt,
      rentalStart: rentalStarts.length > 0 ? new Date(Math.min(...rentalStarts.map((d) => d.getTime()))) : null,
      rentalEnd: rentalEnds.length > 0 ? new Date(Math.max(...rentalEnds.map((d) => d.getTime()))) : null,
      totalAmount,
    };
  });
}

export type QuotationDetail = {
  id: number;
  status: string;
  fulfillmentType: string | null;
  deliveryCharge: number | null;
  discountAmt: number;
  couponCode: string | null;
  createdAt: Date;
  vendorName: string;
  vendorCompanyName: string | null;
  items: {
    id: number;
    quantity: number;
    rentalStart: Date;
    rentalEnd: Date;
    price: number;
    productName: string;
    variantAttributes: { name: string; value: string }[];
  }[];
  subtotal: number;
  totalAmount: number;
  rentalStart: Date | null;
  rentalEnd: Date | null;
};

export async function getCustomerQuotationById(
  quotationId: number,
): Promise<QuotationDetail | null> {
  const customerId = await getCustomerId();
  const q = await prisma.quotation.findFirst({
    where: { id: quotationId, customerId },
    include: {
      vendor: { select: { name: true, companyName: true } },
      coupon: true,
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
              attributes: {
                include: {
                  attribute: { select: { name: true } },
                  value: { select: { value: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!q) return null;
  const subtotal = q.items.reduce((s, i) => s + i.price * i.quantity, 0);
  let discountAmt = 0;
  const couponCode = q.coupon?.code ?? null;
  if (q.coupon) {
    if (q.coupon.type === "FLAT") {
      discountAmt = Math.min(q.coupon.value, subtotal);
    } else {
      const pct = (subtotal * q.coupon.value) / 100;
      discountAmt = q.coupon.maxDiscount != null ? Math.min(pct, q.coupon.maxDiscount) : pct;
    }
  }
  const deliveryCharge = q.deliveryCharge ?? 0;
  const totalAmount = subtotal - discountAmt + deliveryCharge;
  const rentalStarts = q.items.map((i) => i.rentalStart.getTime());
  const rentalEnds = q.items.map((i) => i.rentalEnd.getTime());
  return {
    id: q.id,
    status: q.status,
    fulfillmentType: q.fulfillmentType,
    deliveryCharge: q.deliveryCharge,
    discountAmt,
    couponCode,
    createdAt: q.createdAt,
    vendorName: q.vendor.name,
    vendorCompanyName: q.vendor.companyName,
    items: q.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      rentalStart: item.rentalStart,
      rentalEnd: item.rentalEnd,
      price: item.price,
      productName: item.variant.product.name,
      variantAttributes: item.variant.attributes.map((a) => ({
        name: a.attribute.name,
        value: a.value.value,
      })),
    })),
    subtotal,
    totalAmount,
    rentalStart: rentalStarts.length ? new Date(Math.min(...rentalStarts)) : null,
    rentalEnd: rentalEnds.length ? new Date(Math.max(...rentalEnds)) : null,
  };
}

export type OrderDetail = {
  id: number;
  quotationId: number;
  status: string;
  fulfillmentType: string;
  deliveryCharge: number;
  discountAmt: number;
  couponCode: string | null;
  createdAt: Date;
  vendorName: string;
  vendorCompanyName: string | null;
  items: {
    id: number;
    quantity: number;
    rentalStart: Date;
    rentalEnd: Date;
    price: number;
    productName: string;
    variantAttributes: { name: string; value: string }[];
  }[];
  subtotal: number;
  totalAmount: number;
  rentalStart: Date | null;
  rentalEnd: Date | null;
};

export async function getCustomerOrderById(orderId: number): Promise<OrderDetail | null> {
  const customerId = await getCustomerId();
  const order = await prisma.rentalOrder.findFirst({
    where: { id: orderId, customerId },
    include: {
      quotation: {
        include: {
          vendor: { select: { name: true, companyName: true } },
        },
      },
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
              attributes: {
                include: {
                  attribute: { select: { name: true } },
                  value: { select: { value: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!order) return null;
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = order.discountAmt ?? 0;
  const deliveryCharge = order.deliveryCharge ?? 0;
  const totalAmount = subtotal - discountAmt + deliveryCharge;
  const rentalStarts = order.items.map((i) => i.rentalStart.getTime());
  const rentalEnds = order.items.map((i) => i.rentalEnd.getTime());
  return {
    id: order.id,
    quotationId: order.quotationId,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    deliveryCharge,
    discountAmt,
    couponCode: order.couponCode,
    createdAt: order.createdAt,
    vendorName: order.quotation.vendor.name,
    vendorCompanyName: order.quotation.vendor.companyName,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      rentalStart: item.rentalStart,
      rentalEnd: item.rentalEnd,
      price: item.price,
      productName: item.variant.product.name,
      variantAttributes: item.variant.attributes.map((a) => ({
        name: a.attribute.name,
        value: a.value.value,
      })),
    })),
    subtotal,
    totalAmount,
    rentalStart: rentalStarts.length ? new Date(Math.min(...rentalStarts)) : null,
    rentalEnd: rentalEnds.length ? new Date(Math.max(...rentalEnds)) : null,
  };
}
