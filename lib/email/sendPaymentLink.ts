import { transporter } from ".";

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
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <p>Hi ${customerName},</p>
        <p>
          <strong>${vendorName}</strong> has sent you a payment link for Quotation ${quotationRef}.
        </p>
        <p>
          Click the button below to complete your payment:
        </p>
        <p>
          <a
            href="${paymentUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #059669;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            "
          >
            Pay now
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy this link: <a href="${paymentUrl}" style="word-break: break-all;">${paymentUrl}</a>
        </p>
        <p>If you did not request this or have any questions, please contact the vendor.</p>
      </div>
    `,
  });
}
