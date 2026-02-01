"use client";

import { useState } from "react";
import Link from "next/link";
import {
  removeCartItem,
  updateCartItemQuantity,
  submitQuotation,
  type CartGroupedByVendor,
} from "@/app/(customer)/actions/cart";
import { Trash2, Minus, Plus, FileText } from "lucide-react";

function formatDate(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(x);
}

interface CartClientProps {
  initialGrouped: CartGroupedByVendor[];
}

export default function CartClient({ initialGrouped }: CartClientProps) {
  const [grouped, setGrouped] = useState(initialGrouped);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    quotationIds?: number[];
    error?: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const totalItems = grouped.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  const grandTotal = grouped.reduce((sum, g) => sum + g.subtotal, 0);

  const handleRemove = async (cartItemId: number) => {
    const result = await removeCartItem(cartItemId);
    if (result.success) {
      setGrouped((prev) =>
        prev
          .map((g) => ({
            ...g,
            items: g.items.filter((i) => i.id !== cartItemId),
            subtotal: g.items
              .filter((i) => i.id !== cartItemId)
              .reduce((s, i) => s + i.price * i.quantity, 0),
          }))
          .filter((g) => g.items.length > 0),
      );
    }
  };

  const handleQuantity = async (cartItemId: number, newQty: number) => {
    setUpdatingId(cartItemId);
    const result = await updateCartItemQuantity(cartItemId, newQty);
    setUpdatingId(null);
    if (result.success) {
      setGrouped((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity: newQty } : i,
          ),
          subtotal: g.items.reduce(
            (s, i) => s + i.price * (i.id === cartItemId ? newQty : i.quantity),
            0,
          ),
        })),
      );
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    const result = await submitQuotation();
    setSubmitting(false);
    setSubmitResult(result);
    if (result.success) {
      setGrouped([]);
    }
  };

  if (grouped.length === 0 && !submitResult?.success) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-600 mb-4">Your cart is empty.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  if (submitResult?.success) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quotation submitted
        </h2>
        <p className="text-gray-600 mb-4">
          {submitResult.quotationIds?.length ?? 0} quotation(s) have been
          created (one per vendor). You can view them in My Orders or the vendor
          will contact you.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div
          key={group.vendorId}
          className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">
              {group.vendorCompanyName ?? group.vendorName}
            </h2>
            <p className="text-sm text-gray-500">
              Vendor • {group.items.length} item(s) in this group
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {item.productName}
                  </p>
                  {item.variantSku && (
                    <p className="text-sm text-gray-500">
                      SKU: {item.variantSku}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(item.rentalStart)} →{" "}
                    {formatDate(item.rentalEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      disabled={updatingId === item.id || item.quantity <= 1}
                      onClick={() => handleQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 text-gray-900"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium border-x border-gray-200 py-2 text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 text-gray-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-blue-600 font-medium w-24 text-right">
                    Rs.{item.price * item.quantity}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-red-500/10 hover:border-red-500/50 text-gray-600 hover:text-red-600 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
            <span className="text-sm text-gray-600">
              Subtotal (this vendor):{" "}
              <span className="font-semibold text-gray-900">
                Rs.{group.subtotal}
              </span>
            </span>
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <p className="text-gray-900">
          <span className="font-semibold">{totalItems}</span> item(s) • Total:{" "}
          <span className="font-semibold text-blue-600">
            Rs.{grandTotal}
          </span>
        </p>
        <div className="flex gap-3">
          <Link
            href="/products"
            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 text-gray-700 transition"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            disabled={submitting || totalItems === 0}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            {submitting ? "Submitting…" : "Submit quotation"}
          </button>
        </div>
      </div>

      {submitResult && !submitResult.success && (
        <p className="text-sm text-red-600">{submitResult.error}</p>
      )}

      <p className="text-sm text-gray-500">
        Submitting will create one quotation per vendor. Vendors will receive
        your request and can send you a final quote.
      </p>
    </div>
  );
}
