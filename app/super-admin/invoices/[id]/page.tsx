"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Building2, Package, CreditCard, Receipt } from "lucide-react";

const API = "/api/super-admin/invoices";

interface InvoiceDetail {
  id: number;
  orderId: number;
  rentalAmount: number;
  securityDeposit: number;
  deliveryCharge: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  order: {
    id: number;
    customer: { id: number; name: string; email: string; companyName: string | null };
    quotation: {
      id: number;
      vendor: { id: number; name: string; email: string; companyName: string | null; gstin: string | null };
    };
    items: {
      id: number;
      quantity: number;
      rentalStart: string;
      rentalEnd: string;
      price: number;
      variant: { product: { id: number; name: string } };
    }[];
  };
  payments: {
    id: number;
    amount: number;
    for: string;
    status: string;
    createdAt: string;
  }[];
  createdBy: { id: number; name: string; email: string };
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
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    REFUNDED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function SuperAdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchInvoice() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load invoice");
        setInvoice(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);

  if (loading && !invoice) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/invoices" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/invoices" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error ?? "Invoice not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/super-admin/invoices" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">Invoice #{invoice.id}</span>
          <StatusBadge status={invoice.status} />
          <span className="text-sm text-gray-500">({invoice.paymentStatus})</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Customer" icon={User}>
          <p className="font-medium text-gray-900">{invoice.order?.customer?.name}</p>
          <p className="text-gray-600 text-sm">{invoice.order?.customer?.email}</p>
          {invoice.order?.customer?.companyName && <p className="text-gray-500 text-sm mt-1">{invoice.order.customer.companyName}</p>}
        </DetailCard>

        <DetailCard title="Vendor" icon={Building2}>
          <p className="font-medium text-gray-900">{invoice.order?.quotation?.vendor?.companyName ?? invoice.order?.quotation?.vendor?.name}</p>
          <p className="text-gray-600 text-sm">{invoice.order?.quotation?.vendor?.email}</p>
          {invoice.order?.quotation?.vendor?.gstin && <p className="text-gray-500 text-sm mt-1">GSTIN: {invoice.order.quotation.vendor.gstin}</p>}
          <Link href={`/super-admin/vendors/${invoice.order?.quotation?.vendor?.id}`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View vendor →
          </Link>
        </DetailCard>
      </div>

      <DetailCard title="Amounts" icon={Receipt}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 text-sm">Rental amount</dt>
            <dd className="font-medium text-gray-900">₹{invoice.rentalAmount.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Security deposit</dt>
            <dd className="font-medium text-gray-900">₹{invoice.securityDeposit.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Delivery charge</dt>
            <dd className="font-medium text-gray-900">₹{invoice.deliveryCharge.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Total</dt>
            <dd className="font-bold text-gray-900 text-lg">₹{invoice.totalAmount.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Paid</dt>
            <dd className="font-medium text-blue-600">₹{invoice.paidAmount.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Balance</dt>
            <dd className="font-medium text-gray-900">₹{(invoice.totalAmount - invoice.paidAmount).toLocaleString("en-IN")}</dd>
          </div>
        </dl>
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-4 text-sm">
          <Link href={`/super-admin/orders/${invoice.orderId}`} className="text-blue-600 hover:underline">
            View order #{invoice.orderId} →
          </Link>
        </div>
      </DetailCard>

      <DetailCard title="Order line items" icon={Package}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Rental period</th>
              <th className="pb-2 font-medium text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.order?.items?.map((item) => (
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

      <DetailCard title="Payments" icon={CreditCard}>
        <p className="text-gray-500 text-sm mb-2">Created by: {invoice.createdBy.name} ({invoice.createdBy.email})</p>
        <p className="text-gray-500 text-sm mb-3">Created at: {new Date(invoice.createdAt).toLocaleString()}</p>
        {invoice.payments.length === 0 ? (
          <p className="text-gray-500 text-sm">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">For</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td className="py-2 text-gray-600">{p.for}</td>
                  <td className="py-2">
                    <span className={p.status === "SUCCEEDED" ? "text-green-600 font-medium" : "text-gray-600"}>{p.status}</span>
                  </td>
                  <td className="py-2 text-gray-500">{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DetailCard>
    </div>
  );
}
