"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Building2, Package, FileText } from "lucide-react";

const API = "/api/super-admin/quotations";

interface QuotationDetail {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; name: string; email: string; companyName: string | null };
  vendor: { id: number; name: string; email: string; companyName: string | null; gstin: string | null };
  coupon: { id: number; code: string; type: string; value: number; maxDiscount: number | null } | null;
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
  order: {
    id: number;
    status: string;
    fulfillmentType: string;
    deliveryCharge: number;
    discountAmt: number;
    couponCode: string | null;
    createdAt: string;
  } | null;
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
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function SuperAdminQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchQuotation() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load quotation");
        setQuotation(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load quotation");
      } finally {
        setLoading(false);
      }
    }
    fetchQuotation();
  }, [id]);

  if (loading && !quotation) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/quotations" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </Link>
        <p className="text-gray-500">Loading quotation...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/quotations" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error ?? "Quotation not found"}</div>
      </div>
    );
  }

  const subtotal = quotation.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/super-admin/quotations" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">Quotation #{quotation.id}</span>
          <StatusBadge status={quotation.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Customer" icon={User}>
          <p className="font-medium text-gray-900">{quotation.customer.name}</p>
          <p className="text-gray-600 text-sm">{quotation.customer.email}</p>
          {quotation.customer.companyName && <p className="text-gray-500 text-sm mt-1">{quotation.customer.companyName}</p>}
        </DetailCard>

        <DetailCard title="Vendor" icon={Building2}>
          <p className="font-medium text-gray-900">{quotation.vendor.companyName ?? quotation.vendor.name}</p>
          <p className="text-gray-600 text-sm">{quotation.vendor.email}</p>
          {quotation.vendor.gstin && <p className="text-gray-500 text-sm mt-1">GSTIN: {quotation.vendor.gstin}</p>}
          <Link href={`/super-admin/vendors/${quotation.vendor.id}`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View vendor →
          </Link>
        </DetailCard>
      </div>

      <DetailCard title="Quotation summary" icon={FileText}>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 text-sm">Created</dt>
            <dd className="text-gray-900">{new Date(quotation.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Updated</dt>
            <dd className="text-gray-900">{new Date(quotation.updatedAt).toLocaleString()}</dd>
          </div>
          {quotation.coupon && (
            <>
              <div>
                <dt className="text-gray-500 text-sm">Coupon</dt>
                <dd className="font-medium text-gray-900">{quotation.coupon.code} ({quotation.coupon.type}: {quotation.coupon.value}{quotation.coupon.type === "PERCENTAGE" ? "%" : ""})</dd>
              </div>
              {quotation.coupon.maxDiscount != null && (
                <div>
                  <dt className="text-gray-500 text-sm">Max discount</dt>
                  <dd className="text-gray-900">₹{quotation.coupon.maxDiscount.toLocaleString("en-IN")}</dd>
                </div>
              )}
            </>
          )}
          {quotation.order && (
            <>
              <div>
                <dt className="text-gray-500 text-sm">Order</dt>
                <dd>
                  <Link href={`/super-admin/orders/${quotation.order.id}`} className="text-blue-600 hover:underline">
                    #{quotation.order.id}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Order status</dt>
                <dd><StatusBadge status={quotation.order.status} /></dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Fulfillment</dt>
                <dd className="text-gray-900">{quotation.order.fulfillmentType}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-sm">Delivery charge</dt>
                <dd className="text-gray-900">₹{quotation.order.deliveryCharge.toLocaleString("en-IN")}</dd>
              </div>
            </>
          )}
        </dl>
      </DetailCard>

      <DetailCard title="Line items" icon={Package}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Rental period</th>
              <th className="pb-2 font-medium">Unit price</th>
              <th className="pb-2 font-medium text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{item.variant.product.name}</td>
                <td className="py-2 text-gray-600">{item.quantity}</td>
                <td className="py-2 text-gray-600">
                  {new Date(item.rentalStart).toLocaleDateString()} – {new Date(item.rentalEnd).toLocaleDateString()}
                </td>
                <td className="py-2 text-gray-600">₹{item.price.toLocaleString("en-IN")}</td>
                <td className="py-2 text-right font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 pt-4 border-t border-gray-200 text-right">
          <span className="font-bold text-gray-900">Subtotal: ₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
      </DetailCard>
    </div>
  );
}
