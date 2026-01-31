"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { revalidatePath } from "next/cache";
import {
  OrderStatus,
  Prisma,
  QuotationStatus,
} from "@/generated/prisma/client";

type Action = "send" | "confirm" | "cancel";

export async function quotationAction(quotationId: number, action: Action) {
  const user = await getCurrentUser();

  if (!user || user.role !== "VENDOR") {
    throw new Error("Unauthorized");
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });

  if (!quotation || quotation.vendorId !== user.id) {
    throw new Error("Not found or not yours");
  }

  let updated;

  if (action === "send" && quotation.status === "DRAFT") {
    updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.SENT },
      include: quotationInclude,
    });
  } else if (action === "confirm" && quotation.status === "SENT") {
    updated = await prisma.$transaction(async (tx) => {
      await tx.rentalOrder.create({
        data: {
          quotationId,
          customerId: quotation.customerId,
          status: OrderStatus.CONFIRMED,
          fulfillmentType: "DELIVERY",
          items: {
            create: quotation.items.map((it) => ({
              variantId: it.variantId,
              quantity: it.quantity,
              rentalStart: it.rentalStart,
              rentalEnd: it.rentalEnd,
              price: it.price,
            })),
          },
        },
      });

      return tx.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.CONFIRMED },
        include: quotationInclude,
      });
    });
  } else if (action === "cancel") {
    updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.CANCELLED },
      include: quotationInclude,
    });
  } else {
    throw new Error(`Cannot ${action} from status ${quotation.status}`);
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: `${action.toUpperCase()} quotation`,
      entity: "Quotation",
      entityId: quotationId,
    },
  });

  revalidatePath(`/quotations/${quotationId}`);

  return updated;
}

const quotationInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      addresses: true,
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
          product: true,
          attributes: {
            include: {
              attribute: true,
              value: true,
            },
          },
        },
      },
    },
  },
  order: {
    include: {
      items: true,
      invoice: true,
      pickup: true,
      delivery: true,
      return: true,
      reservations: true,
    },
  },
} satisfies Prisma.QuotationInclude;

export type QuotationWithRelations =
  Prisma.QuotationGetPayload<{
    include: typeof quotationInclude;
  }>;