import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";
import { OrderStatus } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day | week | month

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "day": {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case "week": {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
    }

    const [
      totalRevenueResult,
      activeOrdersCount,
      vendorsCount,
      customersCount,
      productsCount,
      quotationsCount,
      revenueByDay,
      topProducts,
      ordersByStatusRaw,
      quotationsByStatusRaw,
      invoicesByStatusRaw,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: "PAID" },
      }),
      prisma.rentalOrder.count({
        where: { status: OrderStatus.ACTIVE },
      }),
      prisma.user.count({ where: { role: "VENDOR" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.quotation.count(),
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate },
        },
        select: {
          paidAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderItem.groupBy({
        by: ["variantId"],
        _sum: { quantity: true },
        _count: { id: true },
      }),
      prisma.rentalOrder.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.quotation.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const topProductsSorted = [...topProducts].sort(
      (a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0)
    ).slice(0, 10);
    const variantIds = topProductsSorted.map((p) => p.variantId);
    const variants =
      variantIds.length > 0
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
              product: {
                // select: { id: true, name: true, vendorId: true },
                include: {
                  vendor: { select: { id: true, name: true, companyName: true } },
                },
              },
            },
          })
        : [];

    const revenueByDayMap = new Map<string, number>();
    revenueByDay.forEach((inv) => {
      const key = inv.createdAt.toISOString().slice(0, 10);
      revenueByDayMap.set(key, (revenueByDayMap.get(key) || 0) + (inv.paidAmount || 0));
    });

    // Fill all dates in range so the chart always has points to render
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    const allDates: string[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      allDates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    const revenueTrend = allDates.map((date) => ({
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      amount: revenueByDayMap.get(date) ?? 0,
    }));

    const mostRentedProducts = topProductsSorted.map((p) => {
      const v = variants.find((x) => x.id === p.variantId);
      return {
        variantId: p.variantId,
        productName: v?.product?.name ?? "Unknown",
        vendorName: v?.product?.vendor?.companyName ?? v?.product?.vendor?.name ?? "—",
        totalQuantity: p._sum.quantity ?? 0,
        orderCount: p._count.id,
      };
    });

    const orderStatuses = ["CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
    const ordersByStatus = orderStatuses.map((status) => ({
      name: status,
      value: ordersByStatusRaw.find((o) => o.status === status)?._count.id ?? 0,
    }));

    const quotationStatuses = ["DRAFT", "SENT", "CONFIRMED", "CANCELLED"] as const;
    const quotationsByStatus = quotationStatuses.map((status) => ({
      name: status,
      value: quotationsByStatusRaw.find((q) => q.status === status)?._count.id ?? 0,
    }));

    const invoiceStatuses = ["DRAFT", "PARTIALLY_PAID", "PAID", "REFUNDED"] as const;
    const invoicesByStatus = invoiceStatuses.map((status) => ({
      name: status.replace("_", " "),
      value: invoicesByStatusRaw.find((i) => i.status === status)?._count.id ?? 0,
    }));

    const totalRevenue = totalRevenueResult._sum.paidAmount ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        activeOrdersCount,
        vendorsCount,
        customersCount,
        productsCount,
        quotationsCount,
        revenueTrend,
        mostRentedProducts,
        ordersByStatus,
        quotationsByStatus,
        invoicesByStatus,
        period,
      },
    });
  } catch (error) {
    console.error("Super Admin dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
