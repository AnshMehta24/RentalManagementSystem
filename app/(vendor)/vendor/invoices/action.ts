"use server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";

export type VendorInvoiceRow = {
  id: number;
  orderId: number;
  rentalAmount: number;
  securityDeposit: number;
  deliveryCharge: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
};

export async function getVendorInvoices(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: VendorInvoiceRow[]; total: number; page: number; limit: number }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") {
    return { data: [], total: 0, page: 1, limit: 20 };
  }

  const vendorId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(50, Math.max(1, params?.limit ?? 20));

  const where: {
    order: { quotation: { vendorId: number }; customer?: { OR?: unknown[] } };
    status?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {
    order: { quotation: { vendorId } },
  };

  if (params?.status?.trim()) where.status = params.status.trim();
  if (params?.dateFrom) {
    const d = new Date(params.dateFrom);
    if (!Number.isNaN(d.getTime())) {
      where.createdAt = { ...where.createdAt, gte: d };
    }
  }
  if (params?.dateTo) {
    const dTo = new Date(params.dateTo);
    dTo.setHours(23, 59, 59, 999);
    if (!Number.isNaN(dTo.getTime())) {
      where.createdAt = { ...where.createdAt, lte: dTo };
    }
  }
  if (params?.search?.trim()) {
    where.order.customer = {
      OR: [
        { name: { contains: params.search.trim(), mode: "insensitive" } },
        { email: { contains: params.search.trim(), mode: "insensitive" } },
      ],
    };
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        order: {
          include: {
            customer: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  const data: VendorInvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    orderId: inv.orderId,
    rentalAmount: inv.rentalAmount,
    securityDeposit: inv.securityDeposit,
    deliveryCharge: inv.deliveryCharge,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    status: inv.status,
    createdAt: inv.createdAt,
    customerName: inv.order?.customer?.name ?? "",
    customerEmail: inv.order?.customer?.email ?? "",
  }));

  return { data, total, page, limit };
}
