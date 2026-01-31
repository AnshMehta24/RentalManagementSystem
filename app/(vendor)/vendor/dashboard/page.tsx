import Link from "next/link";
import { JSX } from "react";

export default function VendorDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Welcome to your vendor dashboard. Manage your inventory, orders, and more.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Active Rentals</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">₹0</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Inventory Items</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <p className="text-sm text-gray-600">No orders yet</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/vendor/products"
              className="block rounded-lg border border-gray-200 p-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Manage Products
            </Link>
            <Link
              href="/vendor/orders"
              className="block rounded-lg border border-gray-200 p-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              View Orders
            </Link>
            <Link
              href="/vendor/invoices"
              className="block rounded-lg border border-gray-200 p-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              View Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
