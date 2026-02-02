import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripeInstance from "@/lib/stripeInstance";
import { prisma } from "@/lib/prisma";
import {
  OrderStatus,
  QuotationStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentFor,
} from "@/generated/prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Invalid webhook config" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripeInstance.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const quotationIdRaw = session.metadata?.quotationId;
      if (!quotationIdRaw) return NextResponse.json({ received: true });

      const quotationId = parseInt(quotationIdRaw, 10);
      if (!Number.isInteger(quotationId)) {
        return NextResponse.json(
          { error: "Invalid quotationId" },
          { status: 400 },
        );
      }

      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { items: true, coupon: true, order: true },
      });

      if (
        !quotation ||
        quotation.status !== QuotationStatus.SENT ||
        quotation.order
      ) {
        return NextResponse.json({ received: true });
      }

      const amountPaid = (session.amount_total ?? 0) / 100;
      const subtotal = (session.amount_subtotal ?? 0) / 100;
      const discountAmt = (session.total_details?.amount_discount ?? 0) / 100;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      if (!paymentIntentId) {
        return NextResponse.json(
          { error: "Missing payment intent" },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.rentalOrder.create({
          data: {
            quotationId,
            customerId: quotation.customerId,
            status: OrderStatus.CONFIRMED,
            fulfillmentType: quotation.fulfillmentType ?? "DELIVERY",
            deliveryCharge: quotation.deliveryCharge ?? 0,
            couponCode: quotation.coupon?.code ?? null,
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

        const totalAmount =
          subtotal - discountAmt + (quotation.deliveryCharge ?? 0);

        const invoice = await tx.invoice.create({
          data: {
            orderId: order.id,
            createdByUserId: quotation.vendorId,
            rentalAmount: subtotal,
            securityDeposit: 0,
            deliveryCharge: quotation.deliveryCharge ?? 0,
            totalAmount,
            paidAmount: amountPaid,
            status:
              amountPaid >= totalAmount
                ? InvoiceStatus.PAID
                : InvoiceStatus.PARTIALLY_PAID,
          },
        });

        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: amountPaid,
            for: PaymentFor.RENT,
            status: PaymentStatus.SUCCEEDED,
            stripePaymentIntentId: paymentIntentId,
            stripeCheckoutSessionId: session.id,
          },
        });

        await tx.quotation.update({
          where: { id: quotationId },
          data: { status: QuotationStatus.CONFIRMED },
        });
      });

      return NextResponse.json({ received: true });
    }

    default:
      return NextResponse.json({ received: true });
  }
}
