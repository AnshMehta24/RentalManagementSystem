"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import { getVendorInvoices, type VendorInvoiceRow } from "./action";

const limit = 20;

function statusLabel(s: string): string {
  if (s === "DRAFT") return "Pending payment";
  if (s === "PAID") return "Paid";
  if (s === "PARTIALLY_PAID") return "Partially paid";
  if (s === "REFUNDED") return "Refunded";
  return s;
}

function statusClass(s: string): string {
  if (s === "PAID") return "bg-green-100 text-green-800";
  if (s === "PARTIALLY_PAID") return "bg-yellow-100 text-yellow-800";
  if (s === "REFUNDED") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-600";
}

export default function InvoicesClient({
  initialData,
  initialTotal,
}: {
  initialData: VendorInvoiceRow[];
  initialTotal: number;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchInvoices = useCallback(
    async (pageOverride?: number) => {
      setLoading(true);
      setError(null);
      const p = pageOverride ?? page;
      try {
        const result = await getVendorInvoices({
          page: p,
          limit,
          status: statusFilter || undefined,
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        setData(result.data);
        setTotal(result.total);
        if (pageOverride != null) setPage(pageOverride);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, search, dateFrom, dateTo]
  );

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchInvoices();
  }, [page]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setPage(1)}
            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Pending payment</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <button
            onClick={() => fetchInvoices(1)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Search className="h-4 w-4" /> Apply
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={loading ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-4 font-medium text-gray-700">Invoice</th>
              <th className="p-4 font-medium text-gray-700">Order</th>
              <th className="p-4 font-medium text-gray-700">Customer</th>
              <th className="p-4 font-medium text-gray-700">Rental</th>
              <th className="p-4 font-medium text-gray-700">Total</th>
              <th className="p-4 font-medium text-gray-700">Paid</th>
              <th className="p-4 font-medium text-gray-700">Status</th>
              <th className="p-4 font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              data.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/vendor/orders/${inv.orderId}`)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-4 font-medium text-gray-900">#{inv.id}</td>
                  <td className="p-4 text-gray-600">#{inv.orderId}</td>
                  <td className="p-4 text-gray-600">
                    {inv.customerName || inv.customerEmail || "—"}
                  </td>
                  <td className="p-4 text-gray-600">
                    ₹{inv.rentalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    ₹{inv.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 font-medium text-blue-600">
                    ₹{inv.paidAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        "rounded-full px-2 py-1 text-xs font-medium " + statusClass(inv.status)
                      }
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / limit)} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
