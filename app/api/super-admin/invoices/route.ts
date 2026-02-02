import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom")?.trim();
    const dateTo = searchParams.get("dateTo")?.trim();

    const where: {
      status?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      order?: {
        customer?: {
          OR: {
            name?: { contains: string; mode: "insensitive" };
            email?: { contains: string; mode: "insensitive" };
          }[];
        };
      };
    } = {};
    if (status) where.status = status;
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!Number.isNaN(d.getTime()))
        where.createdAt = { ...where.createdAt, gte: d };
    }
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      if (!Number.isNaN(dTo.getTime()))
        where.createdAt = { ...where.createdAt, lte: dTo };
    }
    if (search) {
      where.order = {
        customer: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              customer: { select: { id: true, name: true, email: true } },
              quotation: {
                select: {
                  vendor: {
                    select: { id: true, name: true, companyName: true },
                  },
                },
              },
            },
          },
          payments: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    const list = invoices.map((inv) => ({
      ...inv,
      paymentStatus:
        inv.status === "PAID"
          ? "paid"
          : inv.paidAmount > 0
            ? "partial"
            : "pending",
      gstBreakdown: null as { taxable?: number; gst?: number } | null,
    }));

    const format = searchParams.get("format");
    if (format === "csv") {
      const headers = [
        "invoiceId",
        "orderId",
        "customer",
        "vendor",
        "rentalAmount",
        "securityDeposit",
        "deliveryCharge",
        "totalAmount",
        "paidAmount",
        "status",
        "paymentStatus",
        "createdAt",
      ];
      const escape = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes('"')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      const rows = list.map((inv) => [
        inv.id,
        inv.orderId,
        inv.order?.customer?.name ?? "",
        inv.order?.quotation?.vendor?.companyName ??
          inv.order?.quotation?.vendor?.name ??
          "",
        inv.rentalAmount,
        inv.securityDeposit,
        inv.deliveryCharge,
        inv.totalAmount,
        inv.paidAmount,
        inv.status,
        inv.paymentStatus,
        inv.createdAt.toISOString().slice(0, 10),
      ]);
      const csv = [
        headers.join(","),
        ...rows.map((r) => r.map(escape).join(",")),
      ].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="invoices-export.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: list,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Super Admin invoices list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
