"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type QuotationListItem,
  type OrderListItem,
} from "@/app/(customer)/actions/orders";
import { FileText, Package } from "lucide-react";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function statusBadge(status: string) {
  const statusLower = status.toLowerCase();
  let className = "px-2 py-0.5 rounded text-xs font-medium ";
  if (statusLower === "confirmed" || statusLower === "sent") className += "bg-blue-100 text-blue-800";
  else if (statusLower === "active" || statusLower === "draft") className += "bg-amber-100 text-amber-800";
  else if (statusLower === "completed") className += "bg-green-100 text-green-800";
  else if (statusLower === "cancelled") className += "bg-red-100 text-red-800";
  else className += "bg-gray-100 text-gray-800";
  return <span className={className}>{status}</span>;
}

interface OrdersClientProps {
  quotations: QuotationListItem[];
  orders: OrderListItem[];
}

export default function OrdersClient({
  quotations,
  orders,
}: OrdersClientProps) {
  const [activeTab, setActiveTab] = useState<"quotations" | "orders">("quotations");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("quotations")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "quotations"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Quotations ({quotations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "orders"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Package className="w-4 h-4" />
          Sales orders ({orders.length})
        </button>
      </div>

      {activeTab === "quotations" && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your quotations
          </h2>
          {quotations.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No quotations yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Quotations are created when you submit your cart at checkout.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white font-medium px-4 py-2 hover:bg-blue-700 transition"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {quotations.map((q) => (
                <li key={q.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-blue-500/50 transition shadow-sm">
                  <Link href={`/quotations/${q.id}`} className="block p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          Quotation #{q.id}
                        </span>
                        {statusBadge(q.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {q.vendorCompanyName ?? q.vendorName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {q.itemCount} item{q.itemCount !== 1 ? "s" : ""}
                        {q.rentalStart && q.rentalEnd && (
                          <> • {formatDate(q.rentalStart)} – {formatDate(q.rentalEnd)}</>
                        )}
                        {q.fulfillmentType && (
                          <> • {q.fulfillmentType.replace("_", " ")}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        Rs.{q.totalAmount.toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(q.createdAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === "orders" && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your sales orders
          </h2>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No orders yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Orders are created when a quotation is confirmed by the vendor.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white font-medium px-4 py-2 hover:bg-blue-700 transition"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => (
                <li key={o.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-blue-500/50 transition shadow-sm">
                  <Link href={`/orders/${o.id}`} className="block p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          Order #{o.id}
                        </span>
                        {statusBadge(o.status)}
                        <span className="text-xs text-gray-500">
                          (Quotation #{o.quotationId})
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {o.vendorCompanyName ?? o.vendorName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {o.itemCount} item{o.itemCount !== 1 ? "s" : ""}
                        {o.rentalStart && o.rentalEnd && (
                          <> • {formatDate(o.rentalStart)} – {formatDate(o.rentalEnd)}</>
                        )}
                        <> • {o.fulfillmentType.replace("_", " ")}</>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        Rs.{o.totalAmount.toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(o.createdAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
