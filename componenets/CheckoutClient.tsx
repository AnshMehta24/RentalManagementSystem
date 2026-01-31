"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  removeCartItem,
  updateCartItemQuantity,
  submitQuotation,
  type CartGroupedByVendor,
  type SubmitQuotationParams,
} from "@/app/(customer)/actions/cart";
import {
  getCustomerAddresses,
  computeDeliveryCharges,
  saveAddress,
  updateAddress,
  deleteAddress,
  type AddressRecord,
  type DeliveryChargeResult,
} from "@/app/(customer)/actions/checkout";
import { Trash2, Minus, Plus, Truck, MapPin, ChevronDown, Pencil } from "lucide-react";

function formatDate(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(x);
}

function formatAddress(a: AddressRecord): string {
  const parts = [a.line1, a.line2, a.city, a.state, a.country, a.pincode].filter(Boolean);
  return parts.join(", ");
}

interface CheckoutClientProps {
  initialGrouped: CartGroupedByVendor[];
  initialAddresses: AddressRecord[];
  customerEmail: string;
}

export default function CheckoutClient({
  initialGrouped,
  initialAddresses,
  customerEmail,
}: CheckoutClientProps) {
  const [grouped, setGrouped] = useState(initialGrouped);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(
    initialAddresses.find((a) => a.type === "SHIPPING" && a.isDefault)?.id ?? initialAddresses[0]?.id ?? null
  );
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddressId, setBillingAddressId] = useState<number | null>(
    initialAddresses.find((a) => a.type === "BILLING" && a.isDefault)?.id ?? null
  );
  const [fulfillmentType, setFulfillmentType] = useState<"STORE_PICKUP" | "DELIVERY">("DELIVERY");
  const [deliveryResult, setDeliveryResult] = useState<DeliveryChargeResult | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    quotationIds?: number[];
    vendorNames?: string[];
    error?: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(initialAddresses.length === 0);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const router = useRouter();

  const editingAddress = editingAddressId
    ? addresses.find((a) => a.id === editingAddressId)
    : null;

  const totalItems = grouped.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const subtotal = grouped.reduce((sum, g) => sum + g.subtotal, 0);
  const deliveryCharge = deliveryResult?.totalDeliveryCharge ?? 0;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    if (fulfillmentType === "DELIVERY" && shippingAddressId) {
      setDeliveryLoading(true);
      computeDeliveryCharges(shippingAddressId)
        .then(setDeliveryResult)
        .catch(() => setDeliveryResult(null))
        .finally(() => setDeliveryLoading(false));
    } else {
      setDeliveryResult({ perVendor: [], totalDeliveryCharge: 0 });
    }
  }, [fulfillmentType, shippingAddressId]);

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
          .filter((g) => g.items.length > 0)
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
            i.id === cartItemId ? { ...i, quantity: newQty } : i
          ),
          subtotal: g.items.reduce(
            (s, i) => s + i.price * (i.id === cartItemId ? newQty : i.quantity),
            0
          ),
        }))
      );
    }
  };

  const handleConfirmOrder = async () => {
    if (fulfillmentType === "DELIVERY" && !shippingAddressId) return;
    setSubmitting(true);
    setSubmitResult(null);
    const deliveryChargePerVendor: Record<number, number> = {};
    deliveryResult?.perVendor?.forEach((p) => {
      deliveryChargePerVendor[p.vendorId] = p.charge;
    });
    const params: SubmitQuotationParams = {
      deliveryAddressId: fulfillmentType === "DELIVERY" ? shippingAddressId ?? undefined : undefined,
      billingAddressId: billingSameAsShipping ? (shippingAddressId ?? undefined) : (billingAddressId ?? undefined),
      fulfillmentType,
      deliveryChargePerVendor,
    };
    const result = await submitQuotation(params);
    setSubmitting(false);
    setSubmitResult(result);
    if (result.success) {
      setGrouped([]);
      const count = result.quotationIds?.length ?? 0;
      const vendors = result.vendorNames?.length ? encodeURIComponent(result.vendorNames.join(",")) : "";
      router.push(`/cart/thank-you?count=${count}${vendors ? `&vendors=${vendors}` : ""}`);
    }
  };

  const getFormData = (form: HTMLFormElement) => ({
    name: (form.querySelector('[name="name"]') as HTMLInputElement)?.value || null,
    line1: (form.querySelector('[name="line1"]') as HTMLInputElement)?.value ?? "",
    line2: (form.querySelector('[name="line2"]') as HTMLInputElement)?.value || null,
    city: (form.querySelector('[name="city"]') as HTMLInputElement)?.value ?? "",
    state: (form.querySelector('[name="state"]') as HTMLInputElement)?.value ?? "",
    country: (form.querySelector('[name="country"]') as HTMLInputElement)?.value ?? "",
    pincode: (form.querySelector('[name="pincode"]') as HTMLInputElement)?.value ?? "",
  });

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddressFormError(null);
    const form = e.currentTarget;
    const data = getFormData(form);
    if (editingAddressId) {
      const res = await updateAddress(editingAddressId, {
        ...data,
        isDefault: editingAddress?.isDefault ?? false,
      });
      if (res.success) {
        const list = await getCustomerAddresses();
        setAddresses(list);
        setShowNewAddress(false);
        setEditingAddressId(null);
        setShippingAddressId(editingAddressId);
      } else {
        setAddressFormError(res.error ?? "Failed to update");
      }
    } else {
      const res = await saveAddress({
        type: "SHIPPING",
        ...data,
        isDefault: addresses.length === 0,
      });
      if (res.success && res.addressId) {
        const list = await getCustomerAddresses();
        setAddresses(list);
        setShippingAddressId(res.addressId);
        setShowNewAddress(false);
      } else {
        setAddressFormError(res.error ?? "Failed to save");
      }
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Remove this address?")) return;
    const res = await deleteAddress(addressId);
    if (res.success) {
      const list = await getCustomerAddresses();
      setAddresses(list);
      if (shippingAddressId === addressId) {
        setShippingAddressId(list[0]?.id ?? null);
      }
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
        setShowNewAddress(list.length === 0);
      }
    }
  };

  if (grouped.length === 0 && !submitResult?.success) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
        <p className="text-[var(--foreground)]/80 mb-4">Your cart is empty.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-white font-medium hover:bg-[var(--accent-hover)] transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
      {/* Left: Checkout form - Shopify style */}
      <div className="lg:col-span-3 space-y-6">
        {/* Cart items (editable) - desktop */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 hidden lg:block">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Cart items</h2>
          <ul className="divide-y divide-[var(--border)]">
            {grouped.flatMap((g) =>
              g.items.map((item) => (
                <li key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-[var(--foreground)]/60">
                      {formatDate(item.rentalStart)} → {formatDate(item.rentalEnd)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center rounded border border-[var(--border)] overflow-hidden">
                      <button
                        type="button"
                        disabled={updatingId === item.id || item.quantity <= 1}
                        onClick={() => handleQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border)]/50 disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm border-x border-[var(--border)]">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => handleQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border)]/50 disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-[var(--accent)] w-20 text-right">Rs.{item.price * item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded border border-[var(--border)] hover:bg-red-500/10 text-[var(--foreground)]/70"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Contact */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">1</span>
            Contact
          </h2>
          <p className="text-sm text-[var(--foreground)]/80">{customerEmail}</p>
        </section>

        {/* Shipping address */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">2</span>
            Shipping address
          </h2>
          {fulfillmentType === "DELIVERY" && (
            <p className="text-xs text-[var(--foreground)]/70 mb-3">
              A delivery address is required to place your order.
            </p>
          )}
          <div className="space-y-3">
            {addresses.length > 0 && (
              <ul className="space-y-2">
                {addresses.map((a) => (
                  <li
                    key={a.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border ${
                      shippingAddressId === a.id
                        ? "border-[var(--accent)] bg-[var(--accent)]/5"
                        : "border-[var(--border)] bg-[var(--background)]/30"
                    }`}
                  >
                    <label className="flex-1 cursor-pointer min-w-0">
                      <input
                        type="radio"
                        name="shippingAddress"
                        checked={shippingAddressId === a.id}
                        onChange={() => setShippingAddressId(a.id)}
                        className="sr-only"
                      />
                      <span className="text-sm text-[var(--foreground)] block truncate">
                        {a.name && <span className="font-medium">{a.name}, </span>}
                        {formatAddress(a)}
                      </span>
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddressId(a.id);
                          setShowNewAddress(true);
                        }}
                        className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/50 text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition"
                        aria-label="Edit address"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(a.id)}
                        className="p-2 rounded-lg border border-[var(--border)] hover:bg-red-500/10 hover:border-red-500/50 text-[var(--foreground)]/70 hover:text-red-600 transition"
                        aria-label="Remove address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setShowNewAddress(true);
                }}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                + Add new address
              </button>
            )}
            {showNewAddress && (
              <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                <input name="name" placeholder="Name" defaultValue={editingAddress?.name ?? ""} className="sm:col-span-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input name="line1" placeholder="Address line 1" required defaultValue={editingAddress?.line1 ?? ""} className="sm:col-span-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input name="line2" placeholder="Address line 2" defaultValue={editingAddress?.line2 ?? ""} className="sm:col-span-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input name="city" placeholder="City" required defaultValue={editingAddress?.city ?? ""} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input name="state" placeholder="State" required defaultValue={editingAddress?.state ?? ""} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input name="country" placeholder="Country" required defaultValue={editingAddress?.country ?? ""} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input name="pincode" placeholder="Pincode" required defaultValue={editingAddress?.pincode ?? ""} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                {addressFormError && (
                  <p className="sm:col-span-2 text-sm text-red-600">{addressFormError}</p>
                )}
                <div className="sm:col-span-2 flex gap-2">
                  <button type="submit" className="rounded-lg bg-[var(--accent)] text-white px-3 py-2 text-sm font-medium">
                    {editingAddressId ? "Update address" : "Save address"}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAddress(false);
                        setEditingAddressId(null);
                        setAddressFormError(null);
                      }}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Delivery method */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">3</span>
            Delivery method
          </h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === "DELIVERY"}
                onChange={() => setFulfillmentType("DELIVERY")}
                className="text-[var(--accent)]"
              />
              <Truck className="w-4 h-4" />
              <span className="text-sm">Delivery</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === "STORE_PICKUP"}
                onChange={() => setFulfillmentType("STORE_PICKUP")}
                className="text-[var(--accent)]"
              />
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Store pickup</span>
            </label>
          </div>
          {fulfillmentType === "DELIVERY" && shippingAddressId && deliveryLoading && (
            <p className="text-sm text-[var(--foreground)]/60 mt-2">Calculating delivery charge…</p>
          )}
        </section>

        {/* Billing address */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">4</span>
            Billing address
          </h2>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={billingSameAsShipping}
              onChange={(e) => setBillingSameAsShipping(e.target.checked)}
              className="rounded text-[var(--accent)]"
            />
            <span className="text-sm">Same as shipping address</span>
          </label>
          {!billingSameAsShipping && (
            <select
              value={billingAddressId ?? ""}
              onChange={(e) => setBillingAddressId(Number(e.target.value) || null)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-background text-sm"
            >
              <option value="">Select billing address</option>
              {addresses.filter((a) => a.type === "BILLING" || a.type === "SHIPPING").map((a) => (
                <option key={a.id} value={a.id}>{formatAddress(a)}</option>
              ))}
            </select>
          )}
        </section>

        {/* Cart items (collapsible) */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 lg:hidden">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Order items</h2>
          <ul className="divide-y divide-[var(--border)]">
            {grouped.flatMap((g) =>
              g.items.map((item) => (
                <li key={item.id} className="py-3 flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-[var(--foreground)]/60">
                      {formatDate(item.rentalStart)} → {formatDate(item.rentalEnd)} • Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--accent)]">Rs.{item.price * item.quantity}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Right: Order summary - sticky */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-24 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <ChevronDown className="w-4 h-4 lg:hidden" />
              Order summary
            </h2>
          </div>
          <div className="p-5 max-h-[50vh] overflow-y-auto">
            {grouped.map((group) => (
              <div key={group.vendorId} className="mb-4 last:mb-0">
                <p className="text-xs font-medium text-[var(--foreground)]/70 mb-2">
                  {group.vendorCompanyName ?? group.vendorName}
                </p>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="truncate">{item.productName} × {item.quantity}</span>
                      <span className="text-[var(--accent)] shrink-0">Rs.{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-[var(--border)] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground)]/80">Subtotal</span>
              <span>Rs.{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground)]/80">Delivery</span>
              {fulfillmentType === "STORE_PICKUP" ? (
                <span>Store pickup</span>
              ) : deliveryLoading ? (
                <span>Calculating…</span>
              ) : (
                <span>Rs.{deliveryCharge}</span>
              )}
            </div>
            {deliveryResult?.perVendor && deliveryResult.perVendor.some((p) => p.charge > 0) && (
              <div className="pl-2 text-xs text-[var(--foreground)]/60 space-y-0.5">
                {deliveryResult.perVendor.filter((p) => p.charge > 0).map((p) => (
                  <div key={p.vendorId} className="flex justify-between">
                    <span>{p.vendorName}</span>
                    <span>Rs.{p.charge}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between font-semibold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
              <span>Total</span>
              <span className="text-[var(--accent)]">Rs.{total}</span>
            </div>
          </div>
          <div className="p-5 bg-background/50">
            <button
              type="button"
              disabled={
                submitting ||
                totalItems === 0 ||
                (fulfillmentType === "DELIVERY" && !shippingAddressId) ||
                (fulfillmentType === "DELIVERY" && deliveryLoading)
              }
              onClick={handleConfirmOrder}
              className="w-full rounded-lg bg-[var(--accent)] text-white font-medium py-3 hover:bg-[var(--accent-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Confirming…" : "Confirm order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
