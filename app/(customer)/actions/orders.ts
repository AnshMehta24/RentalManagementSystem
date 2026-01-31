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
