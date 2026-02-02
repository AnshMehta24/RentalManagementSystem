"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { RefreshCw, TrendingUp, Users, Package, ShoppingCart, IndianRupee, FileText, Receipt } from "lucide-react";

const API = "/api/super-admin";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899"];

interface DashboardData {
  totalRevenue: number;
  activeOrdersCount: number;
  vendorsCount: number;
  customersCount: number;
  productsCount: number;
  quotationsCount: number;
  revenueTrend: { date: string; label: string; amount: number }[];
  mostRentedProducts: { productName: string; vendorName: string; totalQuantity: number; orderCount: number }[];
  ordersByStatus: { name: string; value: number }[];
  quotationsByStatus: { name: string; value: number }[];
  invoicesByStatus: { name: string; value: number }[];
  period: string;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/dashboard?period=${period}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const d = data!;
  const ordersWithData = d.ordersByStatus.filter((o) => o.value > 0);
  const quotationsWithData = d.quotationsByStatus.filter((q) => q.value > 0);
  const invoicesWithData = d.invoicesByStatus.filter((i) => i.value > 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Rental platform analysis & overview</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
          </select>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            <IndianRupee className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">₹{d.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Active Orders</span>
            <ShoppingCart className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{d.activeOrdersCount}</p>
          <Link href="/super-admin/orders" className="text-blue-600 text-xs font-medium mt-1 hover:underline inline-block">
            View orders →
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Vendors</span>
            <Users className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{d.vendorsCount}</p>
          <Link href="/super-admin/vendors" className="text-blue-600 text-xs font-medium mt-1 hover:underline inline-block">
            View all →
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Customers</span>
            <Users className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{d.customersCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Products</span>
            <Package className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{d.productsCount}</p>
          <Link href="/super-admin/products" className="text-blue-600 text-xs font-medium mt-1 hover:underline inline-block">
            View all →
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Quotations</span>
            <FileText className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{d.quotationsCount}</p>
          <Link href="/super-admin/quotations" className="text-blue-600 text-xs font-medium mt-1 hover:underline inline-block">
            View all →
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Revenue trend ({period === "day" ? "Today" : period === "week" ? "Last 7 days" : "This month"})
        </h2>
        <div className="h-72 min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <AreaChart
              data={d.revenueTrend.length > 0 ? d.revenueTrend : [{ date: new Date().toISOString().slice(0, 10), label: "—", amount: 0 }]}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                domain={[0, "auto"]}
              />
              <Tooltip
                formatter={(value: number) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? new Date(payload[0].payload.date).toLocaleDateString() : ""}
              />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {d.revenueTrend.length > 0 && d.revenueTrend.every((t) => t.amount === 0) && (
          <p className="text-gray-500 text-sm mt-2 text-center">No revenue in this period</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Orders by status
          </h2>
          {ordersWithData.length === 0 ? (
            <p className="text-gray-500 text-sm py-8">No orders</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersWithData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ordersWithData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Orders"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Quotations by status
          </h2>
          {quotationsWithData.length === 0 ? (
            <p className="text-gray-500 text-sm py-8">No quotations</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quotationsWithData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {quotationsWithData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[(i + 1) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Quotations"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Invoices by status
          </h2>
          {invoicesWithData.length === 0 ? (
            <p className="text-gray-500 text-sm py-8">No invoices</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoicesWithData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {invoicesWithData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Invoices"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Most rented products - Bar chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Most rented products (top 10)
        </h2>
        {d.mostRentedProducts.length === 0 ? (
          <p className="text-gray-500 text-sm py-8">No data yet</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={d.mostRentedProducts.map((p) => ({ name: p.productName.length > 20 ? p.productName.slice(0, 20) + "…" : p.productName, quantity: p.totalQuantity, fullName: p.productName }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [value, "Quantity rented"]}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName}
                />
                <Legend />
                <Bar dataKey="quantity" name="Quantity rented" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
