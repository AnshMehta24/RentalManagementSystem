"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { QuotationStatus } from "@/generated/prisma/enums";
import { Address } from "@/generated/prisma/client";
import {
  quotationAction,
  QuotationWithRelations,
  addQuotationItem,
  updateQuotationItem,
  deleteQuotationItem,
  getVendorVariantsForQuotation,
  applyCouponToQuotation,
  removeCouponFromQuotation,
  updateQuotationDeliveryCharge,
  createPaymentLinkForQuotation,
} from "../action";
import type { AddQuotationItemInput, UpdateQuotationItemInput } from "../action";
import { computeQuotationTotals } from "@/lib/quotation";

const steps = ["Quotation", "Quotation Sent", "Rental Order", "Invoice"] as const;
type Step = (typeof steps)[number];

type VendorProduct = Awaited<ReturnType<typeof getVendorVariantsForQuotation>>[number];
type QuotationItemRow = QuotationWithRelations["items"][number];

function AddItemForm({
  vendorProducts,
  pending,
  onLoadProducts,
  onSubmit,
  onCancel,
}: {
  vendorProducts: VendorProduct[] | null;
  pending: boolean;
  onLoadProducts: () => void;
  onSubmit: (input: AddQuotationItemInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [variantId, setVariantId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [price, setPrice] = useState("");

  const variants = vendorProducts?.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      label: `${p.name}${v.attributes?.length ? ` – ${v.attributes.map((a) => a.value.value).join(", ")}` : ""}`,
      salePrice: v.salePrice,
    }))
  ) ?? [];

  const selectedVariant = variantId ? variants.find((v) => v.id === Number(variantId)) : null;
  const defaultPrice = selectedVariant?.salePrice ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId || !rentalStart || !rentalEnd) return;
    const start = new Date(rentalStart);
    const end = new Date(rentalEnd);
    const p = price ? parseFloat(price) : defaultPrice;
    if (Number.isNaN(p) || p < 0) return;
    onSubmit({
      variantId: Number(variantId),
      quantity: Math.max(1, quantity),
      rentalStart: start,
      rentalEnd: end,
      price: p,
    });
  };

  if (vendorProducts === null) {
    return (
      <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Loading products…</p>
        <button type="button" onClick={onLoadProducts} className="mt-2 text-sm text-blue-600 hover:underline">
          Load products
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Variant</label>
          <select
            value={variantId}
            onChange={(e) => {
              setVariantId(e.target.value ? Number(e.target.value) : "");
              const v = variants.find((x) => x.id === Number(e.target.value));
              if (v && !price) setPrice(String(v.salePrice));
            }}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select product variant</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Rental start</label>
          <input
            type="date"
            value={rentalStart}
            onChange={(e) => setRentalStart(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Rental end</label>
          <input
            type="date"
            value={rentalEnd}
            onChange={(e) => setRentalEnd(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Unit price (₹)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={price || (defaultPrice ? String(defaultPrice) : "")}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={defaultPrice ? String(defaultPrice) : ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
          Add item
        </button>
        <button type="button" onClick={onCancel} className="rounded border px-3 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditItemRow({
  item,
  pending,
  onSave,
  onCancel,
}: {
  item: QuotationItemRow;
  pending: boolean;
  onSave: (data: UpdateQuotationItemInput) => void;
  onCancel: () => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [rentalStart, setRentalStart] = useState(
    new Date(item.rentalStart).toISOString().slice(0, 10)
  );
  const [rentalEnd, setRentalEnd] = useState(
    new Date(item.rentalEnd).toISOString().slice(0, 10)
  );
  const [price, setPrice] = useState(String(item.price));

  return (
    <>
      <td className="px-4 py-3">
        <div className="font-medium">{item.variant.product.name}</div>
        <div className="text-xs text-gray-500">
          {item.variant.attributes.map((a) => `${a.attribute.name}: ${a.value.value}`).join(" • ")}
        </div>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min={0}
          step={0.01}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-2 font-medium">₹{(quantity * (parseFloat(price) || 0)).toFixed(2)}</td>
      <td className="px-4 py-2">
        <input
          type="date"
          value={rentalStart}
          onChange={(e) => setRentalStart(e.target.value)}
          className="mr-1 rounded border border-gray-300 px-2 py-1 text-xs"
        />
        <input
          type="date"
          value={rentalEnd}
          onChange={(e) => setRentalEnd(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-2">
        <button
          type="button"
          onClick={() => onSave({ quantity, rentalStart: new Date(rentalStart), rentalEnd: new Date(rentalEnd), price: parseFloat(price) || 0 })}
          disabled={pending}
          className="mr-2 text-blue-600 hover:underline"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="text-gray-600 hover:underline">
          Cancel
        </button>
      </td>
    </>
  );
}

const statusToStep: Record<QuotationStatus, Step | "cancelled"> = {
  DRAFT: "Quotation",
  SENT: "Quotation Sent",
  CONFIRMED: "Rental Order",
  CANCELLED: "cancelled",
};

const isDraft = (q: QuotationWithRelations) => q.status === "DRAFT";

export default function QuotationStepperClient({
  quotation: initialQuotation,
}: {
  quotation: QuotationWithRelations;
  currentVendorId: number;
}) {
  const [quotation, setQuotation] = useState(initialQuotation);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormPending, setAddFormPending] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editFormPending, setEditFormPending] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<Awaited<ReturnType<typeof getVendorVariantsForQuotation>> | null>(null);

  const currentStep = statusToStep[quotation.status];
  const isCancelled = currentStep === "cancelled";
  const draft = isDraft(quotation);

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

  const loadVendorProducts = () => {
    if (vendorProducts !== null) return;
    startTransition(async () => {
      try {
        const products = await getVendorVariantsForQuotation(quotation.id);
        setVendorProducts(products);
      } catch {
        setVendorProducts([]);
      }
    });
  };

  const handleAddItem = async (input: AddQuotationItemInput) => {
    setErrorMsg(null);
    setAddFormPending(true);
    try {
      const updated = await addQuotationItem(quotation.id, input);
      setQuotation(updated);
      setShowAddForm(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAddFormPending(false);
    }
  };

  const handleUpdateItem = async (itemId: number, data: UpdateQuotationItemInput) => {
    setErrorMsg(null);
    setEditFormPending(true);
    try {
      const updated = await updateQuotationItem(itemId, data);
      setQuotation(updated);
      setEditingItemId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setEditFormPending(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (quotation.items.length <= 1) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const updated = await deleteQuotationItem(itemId);
        setQuotation(updated);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to delete item");
      }
    });
  };

  const canSend = quotation.status === "DRAFT" && quotation.items.length > 0;
  const isSent = quotation.status === "SENT";
  const canInvoice = quotation.status === "CONFIRMED" && !quotation.order?.invoice;

  const totals = computeQuotationTotals({
    items: quotation.items,
    coupon: quotation.coupon,
    deliveryCharge: quotation.deliveryCharge,
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponPending, setCouponPending] = useState(false);
  const [deliveryChargeInput, setDeliveryChargeInput] = useState(
    () => (initialQuotation.deliveryCharge != null ? String(initialQuotation.deliveryCharge) : "0")
  );
  const [deliveryPending, setDeliveryPending] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  const [paymentLinkPending, setPaymentLinkPending] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setErrorMsg(null);
    setCouponPending(true);
    try {
      const updated = await applyCouponToQuotation(quotation.id, couponCode.trim());
      setQuotation(updated);
      setCouponCode("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to apply coupon");
    } finally {
      setCouponPending(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setErrorMsg(null);
    setCouponPending(true);
    try {
      const updated = await removeCouponFromQuotation(quotation.id);
      setQuotation(updated);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to remove coupon");
    } finally {
      setCouponPending(false);
    }
  };

  const handleUpdateDeliveryCharge = async () => {
    const val = parseFloat(deliveryChargeInput);
    if (Number.isNaN(val) || val < 0) return;
    setErrorMsg(null);
    setDeliveryPending(true);
    try {
      const updated = await updateQuotationDeliveryCharge(quotation.id, val);
      setQuotation(updated);
      setDeliveryChargeInput(String(updated.deliveryCharge ?? ""));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update delivery charge");
    } finally {
      setDeliveryPending(false);
    }
  };

  const handleCreatePaymentLink = async () => {
    setErrorMsg(null);
    setPaymentLinkPending(true);
    setPaymentLinkUrl(null);
    try {
      const { url } = await createPaymentLinkForQuotation(quotation.id);
      setPaymentLinkUrl(url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create payment link");
    } finally {
      setPaymentLinkPending(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 shadow-sm">
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

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
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

            {quotation.coupon && !isSent && (
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

          {isSent && (
            <div className="border-t p-5">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Summary &amp; Payment</h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Delivery / Shipping</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={deliveryChargeInput}
                      onChange={(e) => setDeliveryChargeInput(e.target.value)}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleUpdateDeliveryCharge}
                      disabled={deliveryPending}
                      className="rounded bg-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-300 disabled:opacity-50"
                    >
                      Update
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Coupon</span>
                    {quotation.coupon ? (
                      <span className="flex items-center gap-2 rounded bg-green-100 px-2 py-1 text-sm text-green-800">
                        {quotation.coupon.code}
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          disabled={couponPending}
                          className="text-green-700 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Code"
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponPending || !couponCode.trim()}
                          className="rounded bg-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-300 disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </>
                    )}
                  </div>
                  {totals.discountAmt > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Discount</span>
                      <span className="font-medium">−₹{totals.discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3 flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleCreatePaymentLink}
                    disabled={paymentLinkPending || totals.total <= 0}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {paymentLinkPending ? "Creating…" : "Confirm and Send Payment Link"}
                  </button>
                  {paymentLinkUrl && (
                    <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                      <p className="mb-2 font-medium text-green-800">Payment link created. Send this to the customer:</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={paymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {paymentLinkUrl}
                        </a>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(paymentLinkUrl)}
                          className="rounded bg-green-200 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-300"
                        >
                          Copy link
                        </button>
                        <a
                          href={paymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order Items</h3>
              {draft && (
                <button
                  type="button"
                  onClick={() => {
                    loadVendorProducts();
                    setShowAddForm((v) => !v);
                    setErrorMsg(null);
                  }}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {showAddForm ? "Cancel" : "Add product"}
                </button>
              )}
            </div>

            {draft && showAddForm && (
              <AddItemForm
                vendorProducts={vendorProducts}
                pending={addFormPending}
                onLoadProducts={loadVendorProducts}
                onSubmit={handleAddItem}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Rental Period</th>
                    {draft && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotation.items.map((item) => (
                    <tr key={item.id}>
                      {editingItemId === item.id ? (
                        <EditItemRow
                          item={item}
                          pending={editFormPending}
                          onSave={(data) => handleUpdateItem(item.id, data)}
                          onCancel={() => setEditingItemId(null)}
                        />
                      ) : (
                        <>
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
                          {draft && (
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setEditingItemId(item.id)}
                                className="mr-2 text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={quotation.items.length <= 1}
                                className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                title={quotation.items.length <= 1 ? "At least one product required" : "Remove"}
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {draft && quotation.items.length === 0 && (
              <p className="mt-3 text-sm text-amber-600">
                Add at least one product before sending this quotation.
              </p>
            )}
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

              {isSent && (
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={pending}
                  className="rounded-md border px-5 py-2 text-sm"
                >
                  Cancel quotation
                </button>
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
