"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";

const API = "/api/super-admin/orders";

interface OrderRow {
  id: number;
  status: string;
  fulfillmentType: string;
  customer: { id: number; name: string; email: string };
  quotation: { vendor: { id: number; name: string; companyName: string | null } };
  items: { id: number; quantity: number; rentalStart: string; rentalEnd: string; variant: { product: { name: string } } }[];
  pickup: unknown;
  delivery: unknown;
  return: unknown;
  hasLateReturn?: boolean;
  createdAt: string;
}

export default function SuperAdminOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const limit = 20;

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    if (fulfillmentFilter) params.set("fulfillmentType", fulfillmentFilter);
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
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [page, statusFilter, fulfillmentFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rental Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search customer or Order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setPage(1)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 w-48"
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
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select
            value={fulfillmentFilter}
            onChange={(e) => (setFulfillmentFilter(e.target.value), setPage(1))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          >
            <option value="">All fulfillment</option>
            <option value="STORE_PICKUP">STORE_PICKUP</option>
            <option value="DELIVERY">DELIVERY</option>
          </select>
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Apply
          </button>
          <button
            onClick={fetchOrders}
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
              <th className="p-4 font-medium text-gray-700">Order ID</th>
              <th className="p-4 font-medium text-gray-700">Customer</th>
              <th className="p-4 font-medium text-gray-700">Vendor</th>
              <th className="p-4 font-medium text-gray-700">Status</th>
              <th className="p-4 font-medium text-gray-700">Fulfillment</th>
              <th className="p-4 font-medium text-gray-700">Items</th>
              <th className="p-4 font-medium text-gray-700">Late</th>
              <th className="p-4 font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">No orders found</td>
              </tr>
            ) : (
              data.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/super-admin/orders/${o.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-medium text-gray-900">#{o.id}</td>
                  <td className="p-4">
                    <p className="text-gray-900">{o.customer?.name}</p>
                    <p className="text-gray-500 text-sm">{o.customer?.email}</p>
                  </td>
                  <td className="p-4 text-gray-600">
                    {o.quotation?.vendor?.companyName ?? o.quotation?.vendor?.name ?? "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : o.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{o.fulfillmentType}</td>
                  <td className="p-4 text-gray-600">
                    {o.items?.length ?? 0} line(s)
                  </td>
                  <td className="p-4">
                    {o.hasLateReturn ? (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                        Late
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(o.createdAt).toLocaleDateString()}
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
