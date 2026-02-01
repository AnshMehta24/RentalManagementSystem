"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import type { OrderBoardData } from "@/types/order";
import type { OrderStatus, QuotationStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

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

const orderDetailQuotationInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      addresses: {
        select: {
          id: true,
          type: true,
          name: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          isDefault: true,
        },
        orderBy: { isDefault: "desc" as const },
      },
    },
  },
  vendor: {
    select: {
      id: true,
      name: true,
      companyName: true,
      companyLogo: true,
      gstin: true,
    },
  },
  coupon: true,
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              isRentable: true,
            },
          },
          attributes: {
            include: {
              attribute: {
                select: { id: true, name: true, displayType: true },
              },
              value: {
                select: { id: true, value: true, extraPrice: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.QuotationInclude;

export type OrderDetailWithRelations = Prisma.RentalOrderGetPayload<{
  include: {
    customer: { select: { id: true; name: true; email: true; companyName: true } };
    quotation: { include: typeof orderDetailQuotationInclude };
    items: {
      include: {
        variant: {
          include: {
            product: { select: { id: true; name: true } };
            attributes: {
              include: {
                attribute: { select: { id: true; name: true } };
                value: { select: { id: true; value: true } };
              };
            };
          };
        };
      };
    };
    invoice: true;
    pickup: true;
    delivery: true;
    return: { include: { handledBy: { select: { id: true; name: true } } } };
  };
}>;

export async function getOrderByIdForVendor(
  orderId: number,
): Promise<OrderDetailWithRelations | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") return null;

  const order = await prisma.rentalOrder.findUnique({
    where: {
      id: orderId,
      quotation: { vendorId: user.id },
    },
    include: {
      customer: {
        select: { id: true, name: true, email: true, companyName: true },
      },
      quotation: {
        include: orderDetailQuotationInclude,
      },
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true } },
              attributes: {
                include: {
                  attribute: { select: { id: true, name: true } },
                  value: { select: { id: true, value: true } },
                },
              },
            },
          },
        },
      },
      invoice: true,
      pickup: true,
      delivery: true,
      return: {
        include: { handledBy: { select: { id: true, name: true } } },
      },
    },
  });

  return order as OrderDetailWithRelations | null;
}

/** Create a DRAFT invoice for an order (vendor only). Used from the stepper Invoice step. */
export async function createInvoiceForOrder(
  orderId: number,
): Promise<OrderDetailWithRelations> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") {
    throw new Error("Unauthorized");
  }

  const order = await prisma.rentalOrder.findUnique({
    where: {
      id: orderId,
      quotation: { vendorId: user.id },
    },
    include: {
      items: true,
      invoice: true,
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.invoice) throw new Error("Invoice already exists for this order");

  const rentalAmount = order.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const deliveryCharge = order.deliveryCharge ?? 0;
  const securityDeposit = 0;
  const totalAmount = rentalAmount + securityDeposit + deliveryCharge;

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      createdByUserId: user.id,
      rentalAmount,
      securityDeposit,
      deliveryCharge,
      totalAmount,
      paidAmount: 0,
      status: "DRAFT",
    },
  });

  const updated = await getOrderByIdForVendor(orderId);
  if (!updated) throw new Error("Order not found after creating invoice");
  return updated;
}

export type RecordReturnInput = {
  returnedAt: Date;
  lateFee?: number;
  damageFee?: number;
  depositRefunded?: number;
};

/** Record return for an order (vendor only). Creates Return and sets order status to COMPLETED. */
export async function recordReturn(
  orderId: number,
  data: RecordReturnInput,
): Promise<OrderDetailWithRelations> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") {
    throw new Error("Unauthorized");
  }

  const vendorId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);

  const order = await prisma.rentalOrder.findUnique({
    where: {
      id: orderId,
      quotation: { vendorId },
    },
    include: { return: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.return) throw new Error("Return already recorded for this order");

  await prisma.$transaction([
    prisma.return.create({
      data: {
        orderId: order.id,
        handledByUserId: vendorId,
        returnedAt: data.returnedAt,
        lateFee: data.lateFee ?? 0,
        damageFee: data.damageFee ?? 0,
        depositRefunded: data.depositRefunded ?? 0,
      },
    }),
    prisma.rentalOrder.update({
      where: { id: orderId },
      data: { status: "COMPLETED" as OrderStatus },
    }),
  ]);

  const updated = await getOrderByIdForVendor(orderId);
  if (!updated) throw new Error("Order not found after recording return");
  return updated;
}
