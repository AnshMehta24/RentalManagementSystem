import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";
import { getBlockedVendorIds, blockVendor, unblockVendor } from "@/lib/blockedVendors";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const blockedOnly = searchParams.get("blocked") === "true";

    const blockedIds = await getBlockedVendorIds();

    const where: {
      role: "VENDOR";
      name?: { contains: string; mode: "insensitive" };
      email?: { contains: string; mode: "insensitive" };
      companyName?: { contains: string; mode: "insensitive" };
      id?: { in: number[] };
      OR?: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" }; companyName?: { contains: string; mode: "insensitive" } }[];
    } = { role: "VENDOR" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (blockedOnly && blockedIds.length > 0) {
      where.id = { in: blockedIds };
    } else if (blockedOnly) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page,
        limit,
      });
    }

    const [vendors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          gstin: true,
          createdAt: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const vendorIds = vendors.map((v) => v.id);
    const revenueByVendor =
      vendorIds.length > 0
        ? await prisma.invoice.findMany({
            where: {
              order: {
                quotation: { vendorId: { in: vendorIds } },
              },
              status: "PAID",
            },
            select: {
              order: { select: { quotation: { select: { vendorId: true } } } },
              paidAmount: true,
            },
          })
        : [];

    const revenueMap = new Map<number, number>();
    revenueByVendor.forEach((inv) => {
      const vid = inv.order?.quotation?.vendorId;
      if (vid != null) {
        revenueMap.set(vid, (revenueMap.get(vid) ?? 0) + (inv.paidAmount ?? 0));
      }
    });

    const list = vendors.map((v) => ({
      ...v,
      revenue: revenueMap.get(v.id) ?? 0,
      isBlocked: blockedIds.includes(v.id),
    }));

    return NextResponse.json({
      success: true,
      data: list,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Super Admin vendors list error:", error);
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

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { vendorId, action } = body as { vendorId: number; action: "block" | "unblock" };

    if (!vendorId || !action || !["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid vendorId / action (block | unblock)" },
        { status: 400 }
      );
    }

    const vendor = await prisma.user.findFirst({
      where: { id: vendorId, role: "VENDOR" },
    });
    if (!vendor) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    if (action === "block") {
      await blockVendor(vendorId);
      return NextResponse.json({
        success: true,
        message: "Vendor blocked",
        data: { vendorId, blocked: true },
      });
    }
    await unblockVendor(vendorId);
    return NextResponse.json({
      success: true,
      message: "Vendor unblocked",
      data: { vendorId, blocked: false },
    });
  } catch (error) {
    console.error("Super Admin vendor block/unblock error:", error);
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
