import { Prisma } from "@/generated/prisma/client";

export const quotationInclude = {
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
        orderBy: { isDefault: "desc" },
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
  paymentLinkLogs: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sentToEmail: true,
      createdAt: true,
    },
  },
} satisfies Prisma.QuotationInclude;

export type QuotationWithRelations = Prisma.QuotationGetPayload<{
  include: typeof quotationInclude;
}>;
