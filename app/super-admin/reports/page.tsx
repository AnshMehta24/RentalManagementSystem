"use client";

import { useState } from "react";
import { Download } from "lucide-react";

const API = "/api/super-admin/reports";

const reportTypes = [
  { value: "revenue", label: "Revenue Report" },
  { value: "vendor", label: "Vendor Performance" },
  { value: "product", label: "Product Rental Frequency" },
  { value: "late", label: "Late Returns & Penalty" },
];

const formats = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "XLSX" },
];

export default function SuperAdminReportsPage() {
  const [type, setType] = useState("revenue");
  const [format, setFormat] = useState("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getReportUrl() {
    const params = new URLSearchParams({ type, format });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `${API}?${params.toString()}`;
  }

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const url = getReportUrl();
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? `report-${type}-${from || "all"}.${format}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-gray-600 text-sm mt-2">Download CSV or XLSX reports by type and date range.</p>
      </header>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
            >
              {reportTypes.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          {(type === "revenue" || type === "vendor" || type === "product") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                />
              </div>
            </>
          )}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {loading ? "Exporting..." : `Download ${reportTypes.find((r) => r.value === type)?.label ?? type} (${format.toUpperCase()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
