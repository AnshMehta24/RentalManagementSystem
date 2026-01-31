"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Download, Search } from "lucide-react";

const API = "/api/super-admin/invoices";

interface InvoiceRow {
  id: number;
  orderId: number;
  rentalAmount: number;
  securityDeposit: number;
  deliveryCharge: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  order?: { customer?: { name: string; email: string }; quotation?: { vendor?: { companyName: string; name: string } } };
  createdAt: string;
}

export default function SuperAdminInvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 20;

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`${API}?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || "Failed to load");
        setData(json.data);
        setTotal(json.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  function exportCsv() {
    const params = new URLSearchParams({ format: "csv", limit: "10000" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    window.open(`${API}?${params}`, "_blank");
  }

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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 w-40"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          />
          <select
            value={statusFilter}
            onChange={(e) => (setStatusFilter(e.target.value), setPage(1))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
            <option value="PAID">PAID</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <button onClick={() => setPage(1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
            <Search className="w-4 h-4" /> Apply
          </button>
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={fetchInvoices} disabled={loading} className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700">
            <RefreshCw className={loading ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
          </button>
        </div>
      </header>
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-4 font-medium text-gray-700">Invoice</th>
              <th className="p-4 font-medium text-gray-700">Customer</th>
              <th className="p-4 font-medium text-gray-700">Vendor</th>
              <th className="p-4 font-medium text-gray-700">Rental</th>
              <th className="p-4 font-medium text-gray-700">Total</th>
              <th className="p-4 font-medium text-gray-700">Paid</th>
              <th className="p-4 font-medium text-gray-700">Status</th>
              <th className="p-4 font-medium text-gray-700">Payment</th>
              <th className="p-4 font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">No invoices found</td></tr>
            ) : (
              data.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/super-admin/invoices/${inv.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-medium text-gray-900">#{inv.id}</td>
                  <td className="p-4 text-gray-600">{inv.order?.customer?.name ?? "-"}</td>
                  <td className="p-4 text-gray-600">{inv.order?.quotation?.vendor?.companyName ?? inv.order?.quotation?.vendor?.name ?? "-"}</td>
                  <td className="p-4 text-gray-600">₹{inv.rentalAmount.toLocaleString("en-IN")}</td>
                  <td className="p-4 font-medium text-gray-900">₹{inv.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="p-4 font-medium text-blue-600">₹{inv.paidAmount.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span className={"px-2 py-1 rounded-full text-xs font-medium " + (inv.status === "PAID" ? "bg-green-100 text-green-800" : inv.status === "PARTIALLY_PAID" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600")}>{inv.status}</span>
                  </td>
                  <td className="p-4 text-gray-600">{inv.paymentStatus}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">Page {page} of {Math.ceil(total / limit)} ({total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
