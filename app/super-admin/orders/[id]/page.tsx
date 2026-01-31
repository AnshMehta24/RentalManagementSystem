"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Building2, Package, Truck, CreditCard, Calendar } from "lucide-react";

const API = "/api/super-admin/orders";

interface OrderDetail {
  id: number;
  status: string;
  fulfillmentType: string;
  deliveryCharge: number;
  couponCode: string | null;
  discountAmt: number;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; name: string; email: string; companyName: string | null };
  quotation: {
    id: number;
    status: string;
    vendorId: number;
    vendor: { id: number; name: string; email: string; companyName: string | null; gstin: string | null };
    coupon: { id: number; code: string; type: string; value: number } | null;
  };
  items: {
    id: number;
    quantity: number;
    rentalStart: string;
    rentalEnd: string;
    price: number;
    variant: {
      id: number;
      sku: string | null;
      product: { id: number; name: string; description: string | null };
    };
  }[];
  pickup: { id: number; pickedAt: string; handledByUserId: number } | null;
  delivery: {
    id: number;
    shippedAt: string | null;
    deliveredAt: string | null;
    deliveryCharge: number;
  } | null;
  return: {
    id: number;
    returnedAt: string;
    lateFee: number;
    damageFee: number;
    depositRefunded: number;
  } | null;
  invoice: {
    id: number;
    rentalAmount: number;
    securityDeposit: number;
    deliveryCharge: number;
    totalAmount: number;
    paidAmount: number;
    status: string;
    payments: { id: number; amount: number; for: string; status: string; createdAt: string }[];
  } | null;
  hasLateReturn?: boolean;
}

function DetailCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-600",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function SuperAdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load order");
        setOrder(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading && !order) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/orders" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/orders" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error ?? "Order not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/super-admin/orders" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">Order #{order.id}</span>
          <StatusBadge status={order.status} />
          {order.hasLateReturn && (
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">Late return</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Customer" icon={User}>
          <p className="font-medium text-gray-900">{order.customer.name}</p>
          <p className="text-gray-600 text-sm">{order.customer.email}</p>
          {order.customer.companyName && <p className="text-gray-500 text-sm mt-1">{order.customer.companyName}</p>}
        </DetailCard>

        <DetailCard title="Vendor" icon={Building2}>
          <p className="font-medium text-gray-900">{order.quotation?.vendor?.companyName ?? order.quotation?.vendor?.name}</p>
          <p className="text-gray-600 text-sm">{order.quotation?.vendor?.email}</p>
          {order.quotation?.vendor?.gstin && <p className="text-gray-500 text-sm mt-1">GSTIN: {order.quotation.vendor.gstin}</p>}
          <Link href={`/super-admin/vendors/${order.quotation.vendorId}`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View vendor →
          </Link>
        </DetailCard>
      </div>

      <DetailCard title="Order summary" icon={Calendar}>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 text-sm">Fulfillment</dt>
            <dd className="font-medium text-gray-900">{order.fulfillmentType}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Delivery charge</dt>
            <dd className="font-medium text-gray-900">₹{order.deliveryCharge.toLocaleString("en-IN")}</dd>
          </div>
          {order.couponCode && (
            <>
              <div>
                <dt className="text-gray-500 text-sm">Coupon</dt>
                <dd className="font-medium text-gray-900">{order.couponCode}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Discount</dt>
                <dd className="font-medium text-green-600">₹{order.discountAmt.toLocaleString("en-IN")}</dd>
              </div>
            </>
          )}
          <div>
            <dt className="text-gray-500 text-sm">Created</dt>
            <dd className="text-gray-900">{new Date(order.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Quotation</dt>
            <dd>
              <Link href={`/super-admin/quotations/${order.quotation.id}`} className="text-blue-600 hover:underline">
                #{order.quotation.id}
              </Link>
            </dd>
          </div>
        </dl>
      </DetailCard>

      <DetailCard title="Line items" icon={Package}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Rental period</th>
              <th className="pb-2 font-medium text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{item.variant.product.name}</td>
                <td className="py-2 text-gray-600">{item.quantity}</td>
                <td className="py-2 text-gray-600">
                  {new Date(item.rentalStart).toLocaleDateString()} – {new Date(item.rentalEnd).toLocaleDateString()}
                </td>
                <td className="py-2 text-right font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DetailCard>

      {order.pickup && (
        <DetailCard title="Pickup" icon={Truck}>
          <p className="text-gray-900">Picked at: {new Date(order.pickup.pickedAt).toLocaleString()}</p>
        </DetailCard>
      )}

      {order.delivery && (
        <DetailCard title="Delivery" icon={Truck}>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 text-sm">Shipped</dt>
              <dd className="text-gray-900">{order.delivery.shippedAt ? new Date(order.delivery.shippedAt).toLocaleString() : "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Delivered</dt>
              <dd className="text-gray-900">{order.delivery.deliveredAt ? new Date(order.delivery.deliveredAt).toLocaleString() : "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Delivery charge</dt>
              <dd className="text-gray-900">₹{order.delivery.deliveryCharge.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </DetailCard>
      )}

      {order.return && (
        <DetailCard title="Return" icon={Truck}>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 text-sm">Returned at</dt>
              <dd className="text-gray-900">{new Date(order.return.returnedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Late fee</dt>
              <dd className="text-gray-900">₹{order.return.lateFee.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Damage fee</dt>
              <dd className="text-gray-900">₹{order.return.damageFee.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Deposit refunded</dt>
              <dd className="text-gray-900">₹{order.return.depositRefunded.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </DetailCard>
      )}

      {order.invoice && (
        <DetailCard title="Invoice" icon={CreditCard}>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 text-sm">Rental amount</dt>
              <dd className="font-medium text-gray-900">₹{order.invoice.rentalAmount.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Security deposit</dt>
              <dd className="font-medium text-gray-900">₹{order.invoice.securityDeposit.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Delivery charge</dt>
              <dd className="font-medium text-gray-900">₹{order.invoice.deliveryCharge.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Total</dt>
              <dd className="font-bold text-gray-900">₹{order.invoice.totalAmount.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Paid</dt>
              <dd className="font-medium text-blue-600">₹{order.invoice.paidAmount.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Status</dt>
              <dd><StatusBadge status={order.invoice.status} /></dd>
            </div>
          </dl>
          <Link href={`/super-admin/invoices/${order.invoice.id}`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View invoice #{order.invoice.id} →
          </Link>
          {order.invoice.payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Payments</h3>
              <ul className="space-y-1 text-sm">
                {order.invoice.payments.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>₹{p.amount.toLocaleString("en-IN")} ({p.for})</span>
                    <span className={p.status === "SUCCEEDED" ? "text-green-600" : "text-gray-600"}>{p.status}</span>
                    <span className="text-gray-500">{new Date(p.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DetailCard>
      )}
    </div>
  );
}
