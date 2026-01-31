"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";

const API = "/api/super-admin/quotations";

interface QuotationRow {
  id: number;
  status: string;
  customer: { id: number; name: string; email: string };
  vendor: { id: number; name: string; companyName: string | null; email: string };
  items: { id: number; quantity: number; price: number; variant: { product: { name: string } } }[];
  createdAt: string;
}

export default function SuperAdminQuotationsPage() {
  const router = useRouter();
  const [data, setData] = useState<QuotationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const limit = 20;

  const fetchQuotations = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (vendorId && Number.isInteger(parseInt(vendorId, 10))) params.set("vendorId", vendorId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`${API}?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || "Failed to load");
        setData(json.data);
        setTotal(json.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load quotations"))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search, vendorId, dateFrom, dateTo]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search customer, vendor or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchQuotations())}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 w-52"
          />
          <input
            type="text"
            placeholder="Vendor ID"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 w-24"
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
            <option value="SENT">SENT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Apply
          </button>
          <button
            onClick={fetchQuotations}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-4 font-medium text-gray-700">ID</th>
              <th className="p-4 font-medium text-gray-700">Customer</th>
              <th className="p-4 font-medium text-gray-700">Vendor</th>
              <th className="p-4 font-medium text-gray-700">Status</th>
              <th className="p-4 font-medium text-gray-700">Items</th>
              <th className="p-4 font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No quotations found</td>
              </tr>
            ) : (
              data.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/super-admin/quotations/${q.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-medium text-gray-900">#{q.id}</td>
                  <td className="p-4">
                    <p className="text-gray-900">{q.customer?.name}</p>
                    <p className="text-gray-500 text-sm">{q.customer?.email}</p>
                  </td>
                  <td className="p-4 text-gray-600">
                    {q.vendor?.companyName ?? q.vendor?.name}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        q.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800"
                          : q.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{q.items?.length ?? 0} items</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Page {page} of {Math.ceil(total / limit)} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
