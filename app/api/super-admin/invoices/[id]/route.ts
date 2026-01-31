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
    return NextResponse.json({ success: false, error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true, companyName: true } },
            quotation: {
              select: {
                id: true,
                vendor: { select: { id: true, name: true, email: true, companyName: true, gstin: true } },
              },
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
          },
        },
        payments: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const paymentStatus =
      invoice.status === "PAID" ? "paid" : invoice.paidAmount > 0 ? "partial" : "pending";

    return NextResponse.json({
      success: true,
      data: { ...invoice, paymentStatus },
    });
  } catch (error) {
    console.error("Super Admin invoice detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
