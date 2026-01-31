"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { QuotationStatus } from "@/generated/prisma/enums";
import { Address } from "@/generated/prisma/client";
import { quotationAction, QuotationWithRelations } from "../action";

const steps = ["Quotation", "Quotation Sent", "Rental Order", "Invoice"] as const;
type Step = (typeof steps)[number];

const statusToStep: Record<QuotationStatus, Step | "cancelled"> = {
  DRAFT: "Quotation",
  SENT: "Quotation Sent",
  CONFIRMED: "Rental Order",
  CANCELLED: "cancelled",
};

export default function QuotationStepperClient({
  quotation: initialQuotation,
}: {
  quotation: QuotationWithRelations;
  currentVendorId: number;
}) {
  const [quotation, setQuotation] = useState(initialQuotation);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentStep = statusToStep[quotation.status];
  const isCancelled = currentStep === "cancelled";

  const handleAction = (action: "send" | "confirm" | "cancel") => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const updated = await quotationAction(quotation.id, action);
        setQuotation(updated);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Operation failed");
      }
    });
  };

  const canSend = quotation.status === "DRAFT";
  const canConfirm = quotation.status === "SENT";
  const canInvoice = quotation.status === "CONFIRMED" && !quotation.order?.invoice;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="mb-8 flex items-center justify-between rounded-lg border bg-white px-5 ">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Quotation #{quotation.id.toString().padStart(6, "0")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on{" "}
              {new Date(quotation.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            {quotation.vendor.companyLogo && (
              <div className="relative mb-2 h-10 w-28">
                <Image
                  src={quotation.vendor.companyLogo}
                  alt="Company logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <p className="font-medium text-gray-900">
              {quotation.vendor.companyName || quotation.vendor.name}
            </p>
            {quotation.vendor.gstin && (
              <p className="text-xs text-gray-500">GSTIN: {quotation.vendor.gstin}</p>
            )}
          </div>
        </div>

        <div className="mb-10 hidden md:flex">
          {steps.map((label, i) => (
            <div key={label} className="relative flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                    currentStep === label
                      ? "bg-blue-600 text-white border-blue-600"
                      : i < steps.indexOf(currentStep as Step)
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-white text-gray-400 border-gray-300"
                  }`}
                >
                  {i + 1}
                </div>
                <p
                  className={`mt-2 text-xs font-medium ${
                    currentStep === label ? "text-blue-700" : "text-gray-500"
                  }`}
                >
                  {label}
                </p>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={`absolute left-[calc(50%+1rem)] top-4 h-px ${
                    i < steps.indexOf(currentStep as Step)
                      ? "bg-blue-300"
                      : "bg-gray-300"
                  }`}
                  style={{ width: "calc(100% - 2rem)" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="orderQuotationMainCard rounded-lg border bg-white">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Details
              </h2>
              <p className="mt-1 font-medium">{quotation.customer.name}</p>
              <p className="text-sm text-gray-500">{quotation.customer.email}</p>
              {quotation.customer.companyName && (
                <p className="text-sm text-gray-500">
                  {quotation.customer.companyName}
                </p>
              )}
            </div>

            <div
              className={`rounded-md px-4 py-1.5 text-sm font-semibold uppercase tracking-wide ${
                quotation.status === "CANCELLED"
                  ? "bg-red-50 text-red-700"
                  : quotation.status === "CONFIRMED"
                  ? "bg-emerald-50 text-emerald-700"
                  : quotation.status === "SENT"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {quotation.status.replace("_", " ")}
            </div>
          </div>

          <div className="grid mt-10 gap-6 p-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold text-gray-800">Addresses</h3>
              {quotation.customer.addresses.length === 0 ? (
                <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
                  No addresses recorded
                </p>
              ) : (
                <div className="space-y-4">
                  {quotation.customer.addresses.map((addr: Address) => (
                    <div
                      key={addr.id}
                      className="rounded-md border bg-gray-50 p-4 text-sm"
                    >
                      <div className="mb-1 font-medium capitalize">
                        {addr.type.toLowerCase()} address
                        {addr.isDefault && (
                          <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Default
                          </span>
                        )}
                      </div>
                      <p>
                        {addr.line1}
                        {addr.line2 && `, ${addr.line2}`}
                      </p>
                      <p>
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-gray-500">{addr.country}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {quotation.coupon && (
              <div>
                <h3 className="mb-3 font-semibold text-gray-800">
                  Coupon Applied
                </h3>
                <div className="rounded-md border bg-green-50 p-4">
                  <p className="font-medium text-green-800">
                    {quotation.coupon.code}
                  </p>
                  <p className="text-sm text-green-700">
                    {quotation.coupon.type === "FLAT" ? "₹" : ""}
                    {quotation.coupon.value}
                    {quotation.coupon.type === "PERCENTAGE" ? "%" : ""} discount
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-5">
            <h3 className="mb-4 text-lg font-semibold">Order Items</h3>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Rental Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotation.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.variant.product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.variant.attributes
                            .map(
                              (a) => `${a.attribute.name}: ${a.value.value}`
                            )
                            .join(" • ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {new Date(item.rentalStart).toLocaleDateString("en-IN")} –{" "}
                        {new Date(item.rentalEnd).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          {!isCancelled && (
            <div className="flex justify-end gap-3 border-t bg-gray-50 p-5">
              {canSend && (
                <>
                  <button
                    onClick={() => handleAction("send")}
                    disabled={pending}
                    className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    Send Quotation
                  </button>
                  <button
                    onClick={() => handleAction("cancel")}
                    disabled={pending}
                    className="rounded-md border px-5 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}

              {canConfirm && (
                <>
                  <button
                    onClick={() => handleAction("confirm")}
                    disabled={pending}
                    className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Confirm & Create Order
                  </button>
                  <button
                    onClick={() => handleAction("cancel")}
                    disabled={pending}
                    className="rounded-md border px-5 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}

              {canInvoice && quotation.order && (
                <a
                  href={`/invoices/new?orderId=${quotation.order.id}`}
                  className="rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Create Invoice
                </a>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="border-t bg-red-50 p-4 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
