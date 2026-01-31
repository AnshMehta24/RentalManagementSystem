"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import type { OrderBoardData } from "@/types/order";
import type { OrderStatus, QuotationStatus } from "@/generated/prisma/enums";

export async function getOrdersForBoard(): Promise<OrderBoardData[]> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "VENDOR") {
      throw new Error("Unauthorized: Only vendors can access this resource");
    }

    const vendorId = currentUser.id;

    const orders = await prisma.rentalOrder.findMany({
      where: {
        quotation: {
          vendorId: vendorId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotation: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
          },
        },
        pickup: {
          select: {
            id: true,
            pickedAt: true,
          },
        },
        delivery: {
          select: {
            id: true,
            shippedAt: true,
            deliveredAt: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders as OrderBoardData[];
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
}

export async function getOrdersByStatus(
  status: OrderStatus,
): Promise<OrderBoardData[]> {
  const orders = await getOrdersForBoard();
  return orders.filter((order) => order.status === status);
}

/** Quotations for the board: DRAFT, SENT, or CONFIRMED without an order yet */
export async function getConfirmedQuotationsWithoutOrders() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "VENDOR") {
      throw new Error("Unauthorized: Only vendors can access this resource");
    }

    const vendorId = currentUser.id;

    const quotations = await prisma.quotation.findMany({
      where: {
        vendorId: vendorId,
        OR: [
          { status: "DRAFT" as QuotationStatus },
          { status: "SENT" as QuotationStatus },
          { status: "CONFIRMED" as QuotationStatus, order: null },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return quotations;
  } catch (error) {
    console.error("Error fetching confirmed quotations:", error);
    throw new Error("Failed to fetch confirmed quotations");
  }
}
