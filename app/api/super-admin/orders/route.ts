import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status")?.trim();
    const fulfillmentType = searchParams.get("fulfillmentType")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom")?.trim();
    const dateTo = searchParams.get("dateTo")?.trim();

    const where: {
      status?: string;
      fulfillmentType?: string;
      createdAt?: { gte?: Date; lte?: Date };
      customer?: { OR: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }[] };
      id?: number;
    } = {};
    if (status) where.status = status;
    if (fulfillmentType) where.fulfillmentType = fulfillmentType as "STORE_PICKUP" | "DELIVERY";
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!Number.isNaN(d.getTime())) where.createdAt = { ...where.createdAt, gte: d };
    }
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      if (!Number.isNaN(dTo.getTime())) where.createdAt = { ...where.createdAt, lte: dTo };
    }
    if (search) {
      const searchNum = parseInt(search, 10);
      if (Number.isInteger(searchNum) && searchNum > 0) {
        where.id = searchNum;
      } else {
        where.customer = {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        };
      }
    }

    const [orders, total] = await Promise.all([
      prisma.rentalOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          quotation: {
            select: { vendorId: true, vendor: { select: { id: true, name: true, companyName: true } } },
          },
          items: {
            include: {
              variant: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
          pickup: true,
          delivery: true,
          return: true,
          reservations: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rentalOrder.count({ where }),
    ]);

    const now = new Date();
    const ordersWithLate = orders.map((o) => {
      const hasLateReturn = o.items.some((i) => new Date(i.rentalEnd) < now && o.status === "ACTIVE");
      return { ...o, hasLateReturn };
    });

    return NextResponse.json({
      success: true,
      data: ordersWithLate,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Super Admin orders list error:", error);
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
