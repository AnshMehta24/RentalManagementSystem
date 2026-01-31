"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Eye, EyeOff, Search } from "lucide-react";

const API = "/api/super-admin/products";

interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  isRentable: boolean;
  published: boolean;
  vendorId: number;
  vendor: { id: number; name: string; companyName: string | null; email: string } | null;
  variantCount: number;
  totalStock: number;
  reservedOrOut: number;
  createdAt: string;
}

export default function SuperAdminProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [rentableFilter, setRentableFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const limit = 20;

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (vendorId && Number.isInteger(parseInt(vendorId, 10))) params.set("vendorId", vendorId);
    if (publishedFilter) params.set("published", publishedFilter);
    if (rentableFilter) params.set("isRentable", rentableFilter);
    fetch(`${API}?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || "Failed to load");
        setData(json.data);
        setTotal(json.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, [page, search, vendorId, publishedFilter, rentableFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function togglePublish(e: React.MouseEvent, productId: number, currentlyPublished: boolean) {
    e.stopPropagation();
    setActionLoading(productId);
    try {
      const res = await fetch(API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, published: !currentlyPublished }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products (Global)</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setPage(1)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 w-40"
          />
          <input
            type="text"
            placeholder="Vendor ID"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 w-24"
          />
          <select
            value={publishedFilter}
            onChange={(e) => (setPublishedFilter(e.target.value), setPage(1))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          >
            <option value="">All published</option>
            <option value="true">Published</option>
            <option value="false">Unpublished</option>
          </select>
          <select
            value={rentableFilter}
            onChange={(e) => (setRentableFilter(e.target.value), setPage(1))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          >
            <option value="">All rentable</option>
            <option value="true">Rentable</option>
            <option value="false">Not rentable</option>
          </select>
          <button onClick={() => setPage(1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
            <Search className="w-4 h-4" /> Apply
          </button>
          <button onClick={fetchProducts} disabled={loading} className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700">
            <RefreshCw className={loading ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
          </button>
        </div>
      </header>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-4 font-medium text-gray-700">Product</th>
              <th className="p-4 font-medium text-gray-700">Vendor</th>
              <th className="p-4 font-medium text-gray-700">Variants</th>
              <th className="p-4 font-medium text-gray-700">Stock</th>
              <th className="p-4 font-medium text-gray-700">Reserved/Out</th>
              <th className="p-4 font-medium text-gray-700">Status</th>
              <th className="p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No products found</td></tr>
            ) : (
              data.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/super-admin/products/${p.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-gray-500 text-sm truncate max-w-xs">{p.description}</p>}
                  </td>
                  <td className="p-4 text-gray-600">
                    {p.vendor ? (p.vendor.companyName ?? p.vendor.name) : "—"}
                  </td>
                  <td className="p-4 text-gray-600">{p.variantCount}</td>
                  <td className="p-4 text-gray-600">{p.totalStock}</td>
                  <td className="p-4 font-medium text-blue-600">{p.reservedOrOut}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {p.published ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => togglePublish(e, p.id, p.published)}
                      disabled={actionLoading === p.id}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === p.id ? "..." : p.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {/* {p.published ? "Unpublish" : "Publish"} */}
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
