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
    return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const order = await prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        quotation: {
          select: {
            id: true,
            status: true,
            vendorId: true,
            vendor: { select: { id: true, name: true, email: true, companyName: true, gstin: true } },
            coupon: { select: { id: true, code: true, type: true, value: true } },
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, description: true } },
              },
            },
          },
        },
        pickup: true,
        delivery: true,
        return: true,
        reservations: true,
        invoice: {
          include: {
            payments: true,
            createdBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const now = new Date();
    const hasLateReturn = order.items.some(
      (i) => new Date(i.rentalEnd) < now && order.status === "ACTIVE"
    );

    return NextResponse.json({
      success: true,
      data: { ...order, hasLateReturn },
    });
  } catch (error) {
    console.error("Super Admin order detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
