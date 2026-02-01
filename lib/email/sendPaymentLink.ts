import { transporter } from ".";
import { getPaymentLinkTemplate } from "./templates";

export async function sendPaymentLinkEmail({
  to,
  customerName,
  paymentUrl,
  quotationId,
  vendorName,
}: {
  to: string;
  customerName: string;
  paymentUrl: string;
  quotationId: number;
  vendorName: string;
}) {
  const quotationRef = `#${quotationId.toString().padStart(6, "0")}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.MAIL_AUTH_USER,
    to,
    subject: `Payment link for Quotation ${quotationRef} – ${vendorName}`,
    html: getPaymentLinkTemplate({
      customerName,
      vendorName,
      quotationRef,
      paymentUrl,
    }),
  });
}
