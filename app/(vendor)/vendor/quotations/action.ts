"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { revalidatePath } from "next/cache";
import { Prisma, QuotationStatus } from "@/generated/prisma/client";
import stripeInstance from "@/lib/stripeInstance";
import { computeQuotationTotals } from "@/lib/quotation";
import { sendPaymentLinkEmail } from "@/lib/email/sendPaymentLink";

type Action = "send" | "cancel";

/** Order is created only when payment completes (Stripe webhook), not on confirm. */
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
    if (!quotation.items.length) {
      throw new Error("Quotation must have at least one product before sending.");
    }
    updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.SENT },
      include: quotationInclude,
    });
  } else if (action === "cancel") {
    updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.CANCELLED },
      include: quotationInclude,
    });
  } else {
    throw new Error(`Cannot ${action} quotation from status ${quotation.status}`);
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: `${action.toUpperCase()} quotation`,
      entity: "Quotation",
      entityId: quotationId,
    },
  });

  revalidatePath(`/vendor/quotations/${quotationId}`);
  revalidatePath(`/vendor/orders`);

  return updated;
}

/** Vendor products with variants and rental prices for adding items to a DRAFT quotation */
export async function getVendorVariantsForQuotation(quotationId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { vendorId: true, status: true },
  });
  if (!quotation || quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (quotation.status !== "DRAFT") throw new Error("Can only edit items when quotation is in DRAFT");

  const products = await prisma.product.findMany({
    where: { vendorId: user.id, published: true },
    include: {
      variants: {
        include: {
          prices: { include: { period: true } },
          attributes: { include: { attribute: true, value: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return products;
}

export type AddQuotationItemInput = {
  variantId: number;
  quantity: number;
  rentalStart: Date;
  rentalEnd: Date;
  price: number;
};

export async function addQuotationItem(quotationId: number, input: AddQuotationItemInput) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { vendorId: true, status: true },
  });
  if (!quotation || quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (quotation.status !== "DRAFT") throw new Error("Can only add items when quotation is in DRAFT");

  const variant = await prisma.productVariant.findFirst({
    where: { id: input.variantId, product: { vendorId: user.id } },
  });
  if (!variant) throw new Error("Variant not found or not yours");

  if (input.quantity < 1) throw new Error("Quantity must be at least 1");
  if (new Date(input.rentalStart) >= new Date(input.rentalEnd)) throw new Error("Rental end must be after rental start");
  if (input.price < 0) throw new Error("Price must be non-negative");

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      items: {
        create: {
          variantId: input.variantId,
          quantity: input.quantity,
          rentalStart: new Date(input.rentalStart),
          rentalEnd: new Date(input.rentalEnd),
          price: input.price,
        },
      },
    },
    include: quotationInclude,
  });

  revalidatePath(`/vendor/quotations/${quotationId}`);
  return updated;
}

export type UpdateQuotationItemInput = {
  quantity?: number;
  rentalStart?: Date;
  rentalEnd?: Date;
  price?: number;
};

export async function updateQuotationItem(quotationItemId: number, data: UpdateQuotationItemInput) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const item = await prisma.quotationItem.findUnique({
    where: { id: quotationItemId },
    include: { quotation: true },
  });
  if (!item || item.quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (item.quotation.status !== "DRAFT") throw new Error("Can only edit items when quotation is in DRAFT");

  const payload: { quantity?: number; rentalStart?: Date; rentalEnd?: Date; price?: number } = {};
  if (data.quantity !== undefined) {
    if (data.quantity < 1) throw new Error("Quantity must be at least 1");
    payload.quantity = data.quantity;
  }
  if (data.rentalStart !== undefined) payload.rentalStart = new Date(data.rentalStart);
  if (data.rentalEnd !== undefined) payload.rentalEnd = new Date(data.rentalEnd);
  if (data.price !== undefined) {
    if (data.price < 0) throw new Error("Price must be non-negative");
    payload.price = data.price;
  }
  if (Object.keys(payload).length === 0) return getQuotationById(item.quotationId);

  if (payload.rentalStart && payload.rentalEnd && payload.rentalStart >= payload.rentalEnd) {
    throw new Error("Rental end must be after rental start");
  }

  await prisma.quotationItem.update({
    where: { id: quotationItemId },
    data: payload,
  });

  const updated = await getQuotationById(item.quotationId);
  revalidatePath(`/vendor/quotations/${item.quotationId}`);
  return updated;
}

export async function deleteQuotationItem(quotationItemId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const item = await prisma.quotationItem.findUnique({
    where: { id: quotationItemId },
    include: { quotation: { include: { items: true } } },
  });
  if (!item || item.quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (item.quotation.status !== "DRAFT") throw new Error("Can only delete items when quotation is in DRAFT");
  if (item.quotation.items.length <= 1) {
    throw new Error("Quotation must have at least one product. Add another before removing this one.");
  }

  await prisma.quotationItem.delete({
    where: { id: quotationItemId },
  });

  const updated = await prisma.quotation.findUnique({
    where: { id: item.quotationId },
    include: quotationInclude,
  });
  if (!updated) throw new Error("Quotation not found after delete");

  revalidatePath(`/vendor/quotations/${item.quotationId}`);
  return updated;
}


/** Apply coupon to SENT quotation. */
export async function applyCouponToQuotation(quotationId: number, code: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { vendorId: true, status: true },
  });
  if (!quotation || quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (quotation.status !== "SENT") throw new Error("Can only apply coupon when quotation is sent");

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase(), isActive: true },
  });
  if (!coupon) throw new Error("Invalid or inactive coupon code");
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTill) {
    throw new Error("Coupon is not valid for current date");
  }

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { couponId: coupon.id },
    include: quotationInclude,
  });
  revalidatePath(`/vendor/quotations/${quotationId}`);
  return updated;
}

/** Remove coupon from SENT quotation. */
export async function removeCouponFromQuotation(quotationId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { vendorId: true, status: true },
  });
  if (!quotation || quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (quotation.status !== "SENT") throw new Error("Can only change coupon when quotation is sent");

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { couponId: null },
    include: quotationInclude,
  });
  revalidatePath(`/vendor/quotations/${quotationId}`);
  return updated;
}

/** Update delivery charge on SENT quotation. */
export async function updateQuotationDeliveryCharge(quotationId: number, deliveryCharge: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { vendorId: true, status: true },
  });
  if (!quotation || quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (quotation.status !== "SENT") throw new Error("Can only update delivery when quotation is sent");
  if (deliveryCharge < 0) throw new Error("Delivery charge cannot be negative");

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { deliveryCharge },
    include: quotationInclude,
  });
  revalidatePath(`/vendor/quotations/${quotationId}`);
  return updated;
}

/** Create Stripe Checkout Session for quotation; order is created on payment success (webhook). Emails customer, then logs the link in DB. Does not return the URL to the client. */
export async function createPaymentLinkForQuotation(quotationId: number): Promise<{ success: true }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") throw new Error("Unauthorized");

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true, coupon: true, customer: true, vendor: true, order: true },
  });
  if (!quotation || quotation.vendorId !== user.id) throw new Error("Not found or not yours");
  if (quotation.status !== "SENT") throw new Error("Payment link can only be created for sent quotations");
  if (quotation.order) throw new Error("Order already exists for this quotation");

  const existingLog = await prisma.quotationPaymentLinkLog.findFirst({
    where: { quotationId },
    orderBy: { createdAt: "desc" },
  });
  if (existingLog) {
    throw new Error("Payment link was already sent to the customer.");
  }

  const { total } = computeQuotationTotals({
    items: quotation.items,
    coupon: quotation.coupon,
    deliveryCharge: quotation.deliveryCharge,
  });
  if (total <= 0) throw new Error("Total must be greater than zero");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const session = await stripeInstance.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `Quotation #${quotationId.toString().padStart(6, "0")} – Rental`,
            description: `${quotation.customer.name} – ${quotation.items.length} item(s)`,
          },
          unit_amount: Math.round(total * 100), // Stripe uses paise for INR
        },
        quantity: 1,
      },
    ],
    metadata: { quotationId: String(quotationId) },
    success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/vendor/quotations/${quotationId}`,
    customer_email: quotation.customer.email,
  });

  if (!session.url) throw new Error("Failed to create payment session");

  await sendPaymentLinkEmail({
    to: quotation.customer.email,
    customerName: quotation.customer.name,
    paymentUrl: session.url,
    quotationId,
    vendorName: quotation.vendor.companyName ?? quotation.vendor.name,
  });

  await prisma.quotationPaymentLinkLog.create({
    data: {
      quotationId,
      checkoutUrl: session.url,
      sentToEmail: quotation.customer.email,
      sentByUserId: user.id,
    },
  });

  revalidatePath(`/vendor/quotations/${quotationId}`);
  return { success: true };
}

async function getQuotationById(quotationId: number) {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: quotationInclude,
  });
  if (!q) throw new Error("Quotation not found");
  return q;
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
  paymentLinkLogs: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      sentToEmail: true,
      createdAt: true,
    },
  },
} satisfies Prisma.QuotationInclude;

export type QuotationWithRelations =
  Prisma.QuotationGetPayload<{
    include: typeof quotationInclude;
  }>;