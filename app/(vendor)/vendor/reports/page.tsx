"use client";

import { useState } from "react";
import { Download } from "lucide-react";

const API = "/api/vendor/reports";

const reportTypes = [
  { value: "revenue", label: "Revenue Report" },
  { value: "product", label: "Product Rental Frequency" },
  { value: "late", label: "Late Returns & Penalty" },
];

const formats = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "XLSX" },
];

export default function VendorReportsPage() {
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
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? `vendor-report-${type}-${from || "all"}.${format}`;
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
        <p className="mt-2 text-sm text-gray-600">
          Download CSV or XLSX reports for your store. All data is scoped to your vendor account.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Report type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          {(type === "revenue" || type === "product") && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  From (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  To (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {loading
              ? "Exporting..."
              : `Download ${reportTypes.find((r) => r.value === type)?.label ?? type} (${format.toUpperCase()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
