import { transporter } from ".";
import {
  getOrderPlacedVendorTemplate,
  getOrderStatusUpdateCustomerTemplate,
} from "./templates";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** Notify vendor when a new order is placed (payment confirmed). */
export async function sendOrderPlacedToVendor({
  to,
  vendorName,
  orderId,
  customerName,
}: {
  to: string;
  vendorName: string;
  orderId: number;
  customerName: string;
}) {
  const orderViewUrl = `${getBaseUrl()}/vendor/orders/${orderId}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.MAIL_AUTH_USER,
    to,
    subject: `New order #${String(orderId).padStart(6, "0")} – ${customerName}`,
    html: getOrderPlacedVendorTemplate({
      vendorName,
      orderId,
      customerName,
      orderViewUrl,
    }),
  });
}

/** Notify customer when order status is updated (e.g. completed / return recorded). */
export async function sendOrderStatusUpdateToCustomer({
  to,
  customerName,
  orderId,
  status,
  message,
}: {
  to: string;
  customerName: string;
  orderId: number;
  status: string;
  message?: string;
}) {
  const orderViewUrl = `${getBaseUrl()}/orders/${orderId}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.MAIL_AUTH_USER,
    to,
    subject: `Order #${String(orderId).padStart(6, "0")} – ${status.replace("_", " ")}`,
    html: getOrderStatusUpdateCustomerTemplate({
      customerName,
      orderId,
      status,
      orderViewUrl,
      message,
    }),
  });
}
