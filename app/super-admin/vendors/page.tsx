"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, Package } from "lucide-react";

const API = "/api/super-admin/vendors";

interface VendorRow {
  id: number;
  name: string;
  email: string;
  companyName: string | null;
  gstin: string | null;
  createdAt: string;
  _count: { products: number };
  revenue: number;
  isBlocked: boolean;
}

export default function SuperAdminVendorsPage() {
  const router = useRouter();
  const [data, setData] = useState<VendorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const limit = 20;

  const fetchVendors = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (blockedOnly) params.set("blocked", "true");
    fetch(`${API}?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || "Failed to load");
        setData(json.data);
        setTotal(json.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load vendors"))
      .finally(() => setLoading(false));
  }, [page, search, blockedOnly]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  async function toggleBlock(e: React.MouseEvent, vendorId: number, currentlyBlocked: boolean) {
    e.stopPropagation();
    setActionLoading(vendorId);
    try {
      const res = await fetch(API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          action: currentlyBlocked ? "unblock" : "block",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setPage(1)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 w-48"
          />
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Search className="w-4 h-4" /> Apply
          </button>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={blockedOnly}
              onChange={(e) => (setBlockedOnly(e.target.checked), setPage(1))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Blocked only
          </label>
          <button
            onClick={fetchVendors}
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
              <th className="p-4 font-medium text-gray-700">Vendor</th>
              <th className="p-4 font-medium text-gray-700">Company</th>
              <th className="p-4 font-medium text-gray-700">GSTIN</th>
              <th className="p-4 font-medium text-gray-700">Products</th>
              <th className="p-4 font-medium text-gray-700">Revenue</th>
              <th className="p-4 font-medium text-gray-700">Status</th>
              <th className="p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No vendors found
                </td>
              </tr>
            ) : (
              data.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => router.push(`/super-admin/vendors/${v.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{v.name}</p>
                    <p className="text-gray-500 text-sm">{v.email}</p>
                  </td>
                  <td className="p-4 text-gray-600">{v.companyName ?? "—"}</td>
                  <td className="p-4 text-gray-600 text-sm">{v.gstin ?? "—"}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Package className="w-4 h-4" /> {v._count.products}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-blue-600">₹{v.revenue.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        v.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {v.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => toggleBlock(e, v.id, v.isBlocked)}
                      disabled={actionLoading === v.id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        v.isBlocked
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      } disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {actionLoading === v.id ? "..." : v.isBlocked ? "Unblock" : "Block"}
                    </button>
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
