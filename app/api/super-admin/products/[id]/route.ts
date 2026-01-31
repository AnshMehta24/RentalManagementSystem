import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";

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
    return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            gstin: true,
          },
        },
        variants: {
          include: {
            attributes: {
              include: {
                attribute: { select: { id: true, name: true, displayType: true } },
                value: { select: { id: true, value: true, extraPrice: true } },
              },
            },
            prices: {
              include: {
                period: { select: { id: true, name: true, duration: true, unit: true } },
              },
            },
            reservations: {
              select: { id: true, quantity: true, status: true, startDate: true, endDate: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const variantSummaries = product.variants.map((v) => ({
      ...v,
      reservedQty: v.reservations.reduce((s, r) => s + r.quantity, 0),
    }));

    const totalStock = variantSummaries.reduce((s, v) => s + v.quantity, 0);
    const reservedOrOut = variantSummaries.reduce((s, v) => s + v.reservedQty, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        vendor: product.vendor ?? null,
        variants: variantSummaries,
        totalStock,
        reservedOrOut,
      },
    });
  } catch (error) {
    console.error("Super Admin product detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
