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
    return NextResponse.json({ success: false, error: "Invalid quotation ID" }, { status: 400 });
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        vendor: { select: { id: true, name: true, email: true, companyName: true, gstin: true } },
        coupon: { select: { id: true, code: true, type: true, value: true, maxDiscount: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, description: true } },
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            fulfillmentType: true,
            deliveryCharge: true,
            discountAmt: true,
            couponCode: true,
            createdAt: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: quotation });
  } catch (error) {
    console.error("Super Admin quotation detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
