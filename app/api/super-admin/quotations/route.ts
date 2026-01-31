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
    const vendorId = searchParams.get("vendorId")?.trim();
    const customerId = searchParams.get("customerId")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom")?.trim();
    const dateTo = searchParams.get("dateTo")?.trim();

    const where: {
      status?: string;
      vendorId?: number;
      customerId?: number;
      id?: number;
      OR?: { customerId?: { in: number[] }; vendorId?: { in: number[] } }[];
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (status) where.status = status;
    const parsedVendorId = vendorId ? parseInt(vendorId, 10) : NaN;
    if (Number.isInteger(parsedVendorId)) where.vendorId = parsedVendorId;
    const parsedCustomerId = customerId ? parseInt(customerId, 10) : NaN;
    if (Number.isInteger(parsedCustomerId)) where.customerId = parsedCustomerId;
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!Number.isNaN(d.getTime())) where.createdAt = { ...where.createdAt, gte: d };
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      if (!Number.isNaN(d.getTime())) where.createdAt = { ...where.createdAt, lte: d };
    }
    if (search) {
      const searchNum = parseInt(search, 10);
      if (Number.isInteger(searchNum) && searchNum > 0) {
        where.id = searchNum;
      } else {
        const [customers, vendors] = await Promise.all([
          prisma.user.findMany({
            where: {
              role: "CUSTOMER",
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          }),
          prisma.user.findMany({
            where: {
              role: "VENDOR",
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          }),
        ]);
        const cIds = customers.map((c) => c.id);
        const vIds = vendors.map((v) => v.id);
        if (cIds.length > 0 || vIds.length > 0) {
          where.OR = [];
          if (cIds.length > 0) where.OR.push({ customerId: { in: cIds } });
          if (vIds.length > 0) where.OR.push({ vendorId: { in: vIds } });
        } else {
          where.id = -1;
        }
      }
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          vendor: { select: { id: true, name: true, companyName: true, email: true } },
          items: {
            include: {
              variant: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: quotations,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Super Admin quotations list error:", error);
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
