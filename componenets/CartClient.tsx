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
      <div className="rounded-lg border border-(--border) bg-(--card-bg) p-12 text-center">
        <p className="text-(--foreground)/80 mb-4">Your cart is empty.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-(--accent) px-4 py-2 text-white font-medium hover:bg-[var(--accent-hover)] transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  if (submitResult?.success) {
    return (
      <div className="rounded-lg border border-(--border) bg-(--card-bg) p-12 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Quotation submitted
        </h2>
        <p className="text-(--foreground)/80 mb-4">
          {submitResult.quotationIds?.length ?? 0} quotation(s) have been
          created (one per vendor). You can view them in My Orders or the vendor
          will contact you.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-white font-medium hover:bg-[var(--accent-hover)] transition"
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
          className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[var(--border)] bg-background/50">
            <h2 className="font-semibold text-[var(--foreground)]">
              {group.vendorCompanyName ?? group.vendorName}
            </h2>
            <p className="text-sm text-[var(--foreground)]/60">
              Vendor • {group.items.length} item(s) in this group
            </p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    {item.productName}
                  </p>
                  {item.variantSku && (
                    <p className="text-sm text-[var(--foreground)]/60">
                      SKU: {item.variantSku}
                    </p>
                  )}
                  <p className="text-sm text-[var(--foreground)]/70 mt-1">
                    {formatDate(item.rentalStart)} →{" "}
                    {formatDate(item.rentalEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
                    <button
                      type="button"
                      disabled={updatingId === item.id || item.quantity <= 1}
                      onClick={() => handleQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[var(--border)]/50 transition disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium border-x border-[var(--border)] py-2">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[var(--border)]/50 transition disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[var(--accent)] font-medium w-24 text-right">
                    Rs.{item.price * item.quantity}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-lg border border-[var(--border)] hover:bg-red-500/10 hover:border-red-500/50 text-[var(--foreground)]/70 hover:text-red-600 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end">
            <span className="text-sm text-[var(--foreground)]/70">
              Subtotal (this vendor):{" "}
              <span className="font-semibold text-[var(--foreground)]">
                Rs.{group.subtotal}
              </span>
            </span>
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-[var(--foreground)]">
          <span className="font-semibold">{totalItems}</span> item(s) • Total:{" "}
          <span className="font-semibold text-[var(--accent)]">
            Rs.{grandTotal}
          </span>
        </p>
        <div className="flex gap-3">
          <Link
            href="/products"
            className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card-bg)] transition"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            disabled={submitting || totalItems === 0}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            {submitting ? "Submitting…" : "Submit quotation"}
          </button>
        </div>
      </div>

      {submitResult && !submitResult.success && (
        <p className="text-sm text-red-600">{submitResult.error}</p>
      )}

      <p className="text-sm text-[var(--foreground)]/60">
        Submitting will create one quotation per vendor. Vendors will receive
        your request and can send you a final quote.
      </p>
    </div>
  );
}
