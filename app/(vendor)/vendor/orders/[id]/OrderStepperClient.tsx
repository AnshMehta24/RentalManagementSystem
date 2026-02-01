"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Address } from "@/generated/prisma/client";
import type { OrderDetailWithRelations } from "../actions";
import { createInvoiceForOrder, recordReturn } from "../actions";
import { computeQuotationTotals } from "@/lib/quotation";

const steps = ["Quotation", "Quotation Sent", "Rental Order", "Invoice"] as const;
type Step = (typeof steps)[number];

export default function OrderStepperClient({
  order: initialOrder,
}: {
  order: OrderDetailWithRelations;
  currentVendorId: number;
}) {
  const [order, setOrder] = useState(initialOrder);
  const quotation = order.quotation;
  const hasInvoice = Boolean(order.invoice);
  const effectiveStep: Step = hasInvoice ? "Invoice" : "Rental Order";
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const [createInvoicePending, setCreateInvoicePending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [returnPending, setReturnPending] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnedAt, setReturnedAt] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [damageFee, setDamageFee] = useState("");
  const [depositRefunded, setDepositRefunded] = useState("");

  const handleCreateInvoice = async () => {
    setErrorMsg(null);
    setCreateInvoicePending(true);
    try {
      const updated = await createInvoiceForOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setCreateInvoicePending(false);
    }
  };

  const totals = computeQuotationTotals({
    items: quotation.items,
    coupon: quotation.coupon,
    deliveryCharge: quotation.deliveryCharge,
  });

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoicePdf = async () => {
    const el = invoicePrintRef.current;
    if (!el || !order.invoice) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const JsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        ignoreElements: (element) => element.tagName === "IMG",
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new JsPDF("p", "mm", "a4");
      const pdfW = 210;
      const pdfH = 297;
      const ratio = canvas.height / canvas.width;
      const imgH = Math.min(pdfW * ratio, pdfH * 2);
      pdf.addImage(img, "PNG", 0, 0, pdfW, imgH);
      pdf.save(`invoice-${order.invoice.id}.pdf`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF generation failed";
      setPdfError(message);
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRecordReturn = async () => {
    if (!returnedAt.trim()) {
      setReturnError("Return date is required");
      return;
    }
    setReturnError(null);
    setReturnPending(true);
    try {
      const date = new Date(returnedAt);
      if (Number.isNaN(date.getTime())) {
        setReturnError("Invalid return date");
        return;
      }
      const updated = await recordReturn(order.id, {
        returnedAt: date,
        lateFee: lateFee !== "" ? parseFloat(lateFee) : 0,
        damageFee: damageFee !== "" ? parseFloat(damageFee) : 0,
        depositRefunded: depositRefunded !== "" ? parseFloat(depositRefunded) : 0,
      });
      setOrder(updated);
      setReturnedAt("");
      setLateFee("");
      setDamageFee("");
      setDepositRefunded("");
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Failed to record return");
    } finally {
      setReturnPending(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.id.toString().padStart(6, "0")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Confirmed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
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
                  unoptimized
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

        {/* Stepper: steps 1–2 completed, step 3/4 current */}
        <div className="mb-10 hidden md:flex">
          {steps.map((label, i) => {
            const stepIndex = steps.indexOf(effectiveStep);
            const isCompleted = i < stepIndex;
            const isCurrent = effectiveStep === label;
            return (
              <div key={label} className="relative flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-600"
                        : isCompleted
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-white text-gray-400 border-gray-300"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium ${
                      isCurrent ? "text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </p>
                </div>

                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-[calc(50%+1rem)] top-4 h-px ${
                      i < stepIndex ? "bg-blue-300" : "bg-gray-300"
                    }`}
                    style={{ width: "calc(100% - 2rem)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
              <p className="mt-1 font-medium">{quotation.customer.name}</p>
              <p className="text-sm text-gray-500">{quotation.customer.email}</p>
              {quotation.customer.companyName && (
                <p className="text-sm text-gray-500">{quotation.customer.companyName}</p>
              )}
            </div>

            <div className="rounded-md px-4 py-1.5 text-sm font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700">
              CONFIRMED
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
                <h3 className="mb-3 font-semibold text-gray-800">Coupon Applied</h3>
                <div className="rounded-md border bg-green-50 p-4">
                  <p className="font-medium text-green-800">{quotation.coupon.code}</p>
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
                        <div className="font-medium">{item.variant.product.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.variant.attributes
                            .map((a) => `${a.attribute.name}: ${a.value.value}`)
                            .join(" • ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">₹{item.price.toFixed(2)}</td>
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

            {/* Totals */}
            {quotation.items.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Order total</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery charge</span>
                    <span className="font-medium">₹{totals.deliveryCharge.toFixed(2)}</span>
                  </div>
                  {totals.discountAmt > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span className="font-medium">−₹{totals.discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-2 font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invoice step (final step): Create Invoice or show invoice with PDF/print */}
          <div className="border-t p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Invoice</h3>

            {!order.invoice ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <p className="mb-4 text-sm text-gray-600">
                  No invoice has been created for this order yet. Create an invoice; it will be finalised when the customer completes payment.
                </p>
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  disabled={createInvoicePending}
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {createInvoicePending ? "Creating…" : "Create Invoice"}
                </button>
                {errorMsg && (
                  <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between print:hidden">
                  <span className="text-sm text-gray-500">Invoice created</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePrintInvoice}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Print
                    </button>
                    {/* <button
                      type="button"
                      onClick={handleDownloadInvoicePdf}
                      disabled={pdfLoading}
                      className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                      {pdfLoading ? "Generating…" : "Download PDF"}
                    </button> */}
                  </div>
                  {pdfError && (
                    <p className="mt-2 text-sm text-amber-600">
                      PDF download failed; print dialog opened instead. {pdfError}
                    </p>
                  )}
                </div>
                <div
                  ref={invoicePrintRef}
                  className="invoice-print-area rounded-lg border border-gray-200 bg-white p-6 print:border-0 print:shadow-none"
                >
                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">From (Company)</h4>
                    {quotation.vendor.companyLogo && (
                      <div className="relative mb-3 h-14 w-36">
                        <Image
                          src={quotation.vendor.companyLogo}
                          alt="Company logo"
                          fill
                          className="object-contain object-left"
                          unoptimized
                        />
                      </div>
                    )}
                    <p className="font-semibold text-gray-900">
                      {quotation.vendor.companyName || quotation.vendor.name}
                    </p>
                    {quotation.vendor.gstin && (
                      <p className="text-sm text-gray-600">GSTIN: {quotation.vendor.gstin}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Bill To (Buyer)</h4>
                    <p className="font-semibold text-gray-900">{quotation.customer.name}</p>
                    <p className="text-sm text-gray-600">{quotation.customer.email}</p>
                    {quotation.customer.companyName && (
                      <p className="text-sm text-gray-600">{quotation.customer.companyName}</p>
                    )}
                    {quotation.customer.addresses.length > 0 && quotation.customer.addresses[0] && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          {quotation.customer.addresses[0].line1}
                          {quotation.customer.addresses[0].line2 &&
                            `, ${quotation.customer.addresses[0].line2}`}
                        </p>
                        <p>
                          {quotation.customer.addresses[0].city},{" "}
                          {quotation.customer.addresses[0].state}{" "}
                          {quotation.customer.addresses[0].pincode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <p>
                      <span className="font-medium text-gray-500">Invoice #</span> INV-
                      {String(order.invoice.id).padStart(6, "0")}
                    </p>
                    <p>
                      <span className="font-medium text-gray-500">Date</span>{" "}
                      {new Date(order.invoice.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      <span className="font-medium text-gray-500">Order #</span>{" "}
                      {String(order.id).padStart(6, "0")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 text-left text-gray-700">
                      <tr>
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {quotation.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">
                            <div className="font-medium">{item.variant.product.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.variant.attributes
                                .map((a) => `${a.attribute.name}: ${a.value.value}`)
                                .join(" • ")}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">₹{item.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="w-56 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rental amount</span>
                      <span>₹{order.invoice.rentalAmount.toFixed(2)}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-gray-600">Security deposit</span>
                      <span>₹{order.invoice.securityDeposit.toFixed(2)}</span>
                    </div> */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery charge</span>
                      <span>₹{order.invoice.deliveryCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                      <span>Total</span>
                      <span>₹{order.invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Paid</span>
                      <span>₹{order.invoice.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Status</span>
                      <span className="font-medium">
                        {order.invoice.status === "DRAFT"
                          ? "Pending payment"
                          : order.invoice.status === "PAID"
                            ? "Paid"
                            : order.invoice.status === "PARTIALLY_PAID"
                              ? "Partially paid"
                              : order.invoice.status === "REFUNDED"
                                ? "Refunded"
                                : order.invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}

              {/* Return & Refund */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Return & Refund</h3>
                {order.return ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-gray-500">Returned at</dt>
                        <dd className="font-medium text-gray-900">
                          {new Date(order.return.returnedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Recorded by</dt>
                        <dd className="font-medium text-gray-900">
                          {order.return.handledBy?.name ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Late fee</dt>
                        <dd className="font-medium text-gray-900">₹{order.return.lateFee.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Damage fee</dt>
                        <dd className="font-medium text-gray-900">₹{order.return.damageFee.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Deposit refunded</dt>
                        <dd className="font-medium text-green-700">₹{order.return.depositRefunded.toFixed(2)}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-gray-500">Order status: {order.status}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-4 text-sm text-gray-600">
                      Record when the customer returns the items. Optionally add late fee, damage fee, and deposit refunded. Order will be marked as Completed.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label htmlFor="returnedAt" className="mb-1 block text-sm font-medium text-gray-700">
                          Return date & time
                        </label>
                        <input
                          id="returnedAt"
                          type="datetime-local"
                          value={returnedAt}
                          onChange={(e) => setReturnedAt(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="lateFee" className="mb-1 block text-sm font-medium text-gray-700">
                          Late fee (₹)
                        </label>
                        <input
                          id="lateFee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={lateFee}
                          onChange={(e) => setLateFee(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="damageFee" className="mb-1 block text-sm font-medium text-gray-700">
                          Damage fee (₹)
                        </label>
                        <input
                          id="damageFee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={damageFee}
                          onChange={(e) => setDamageFee(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="depositRefunded" className="mb-1 block text-sm font-medium text-gray-700">
                          Deposit refunded (₹)
                        </label>
                        <input
                          id="depositRefunded"
                          type="number"
                          min="0"
                          step="0.01"
                          value={depositRefunded}
                          onChange={(e) => setDepositRefunded(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {returnError && (
                      <p className="mt-2 text-sm text-red-600">{returnError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleRecordReturn}
                      disabled={returnPending}
                      className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                      {returnPending ? "Recording…" : "Record return"}
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
