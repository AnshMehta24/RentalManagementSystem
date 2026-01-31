"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const API = "/api/super-admin/coupons";

interface CouponRow {
  id: number;
  code: string;
  type: string;
  value: number;
  maxDiscount: number | null;
  validFrom: string;
  validTill: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminCouponsPage() {
  const [data, setData] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
        <button onClick={fetchCoupons} disabled={loading} className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700">
          <RefreshCw className={loading ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
        </button>
      </header>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-4 font-medium text-gray-700">Code</th>
              <th className="p-4 font-medium text-gray-700">Type</th>
              <th className="p-4 font-medium text-gray-700">Value</th>
              <th className="p-4 font-medium text-gray-700">Max Discount</th>
              <th className="p-4 font-medium text-gray-700">Valid From</th>
              <th className="p-4 font-medium text-gray-700">Valid Till</th>
              <th className="p-4 font-medium text-gray-700">Active</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No coupons</td></tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{c.code}</td>
                  <td className="p-4 text-gray-600">{c.type}</td>
                  <td className="p-4 font-medium text-blue-600">{c.type === "PERCENTAGE" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="p-4 text-gray-600">{c.maxDiscount != null ? `₹${c.maxDiscount}` : "—"}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(c.validFrom).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(c.validTill).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
