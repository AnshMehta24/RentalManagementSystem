import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripeInstance from "@/lib/stripeInstance";
import { prisma } from "@/lib/prisma";
import { OrderStatus, QuotationStatus } from "@/generated/prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set; quotation payment webhook will not verify signatures.");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripeInstance.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const quotationIdStr = session.metadata?.quotationId;
  if (!quotationIdStr) {
    console.warn("checkout.session.completed missing metadata.quotationId");
    return NextResponse.json({ received: true });
  }

  const quotationId = parseInt(quotationIdStr, 10);
  if (!Number.isInteger(quotationId)) {
    return NextResponse.json({ error: "Invalid quotationId in metadata" }, { status: 400 });
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true, coupon: true },
  });

  if (!quotation) {
    console.error("Quotation not found for payment webhook:", quotationId);
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }
  if (quotation.status !== "SENT") {
    return NextResponse.json({ received: true }); // idempotent: already confirmed
  }
  if (quotation.order) {
    return NextResponse.json({ received: true }); // idempotent: order already created
  }

  const subtotal = quotation.items.reduce((s, i) => s + i.quantity * i.price, 0);
  let discountAmt = 0;
  let couponCode: string | null = null;
  if (quotation.coupon) {
    couponCode = quotation.coupon.code;
    if (quotation.coupon.type === "FLAT") {
      discountAmt = Math.min(quotation.coupon.value, subtotal);
    } else {
      const pct = (subtotal * quotation.coupon.value) / 100;
      discountAmt =
        quotation.coupon.maxDiscount != null
          ? Math.min(pct, quotation.coupon.maxDiscount)
          : pct;
    }
  }
  const deliveryCharge = quotation.deliveryCharge ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.rentalOrder.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
        status: OrderStatus.CONFIRMED,
        fulfillmentType: "DELIVERY",
        deliveryCharge,
        couponCode,
        discountAmt,
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
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.CONFIRMED },
    });
  });

  return NextResponse.json({ received: true });
}
