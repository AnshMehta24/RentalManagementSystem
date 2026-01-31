import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";
import { getBlockedVendorIds } from "@/lib/blockedVendors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(_request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ success: false, error: "Invalid vendor ID" }, { status: 400 });
  }

  try {
    const [vendor, blockedIds] = await Promise.all([
      prisma.user.findFirst({
        where: { id, role: "VENDOR" },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          companyLogo: true,
          gstin: true,
          profileLogo: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { products: true },
          },
          staff: {
            select: {
              id: true,
              permissions: true,
              isActive: true,
              staff: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      getBlockedVendorIds(),
    ]);

    if (!vendor) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    const revenueResult = await prisma.invoice.aggregate({
      where: {
        order: { quotation: { vendorId: id } },
        status: "PAID",
      },
      _sum: { paidAmount: true },
    });

    const orderCount = await prisma.rentalOrder.count({
      where: { quotation: { vendorId: id } },
    });

    const quotationCount = await prisma.quotation.count({
      where: { vendorId: id },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...vendor,
        revenue: revenueResult._sum.paidAmount ?? 0,
        orderCount,
        quotationCount,
        isBlocked: blockedIds.includes(id),
      },
    });
  } catch (error) {
    console.error("Super Admin vendor detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
