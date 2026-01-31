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
    const isActive = searchParams.get("isActive"); // "true" | "false"
    const search = searchParams.get("search")?.trim() || "";

    const where: { isActive?: boolean; code?: { contains: string; mode: "insensitive" } } = {};
    if (isActive !== undefined && isActive !== "") where.isActive = isActive === "true";
    if (search) where.code = { contains: search, mode: "insensitive" };

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: coupons,
      count: coupons.length,
    });
  } catch (error) {
    console.error("Super Admin coupons list error:", error);
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
