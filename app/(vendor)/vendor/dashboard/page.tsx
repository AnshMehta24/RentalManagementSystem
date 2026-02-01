import Link from "next/link";
import { JSX } from "react";
import { getVendorDashboardData } from "./action";

export default async function VendorDashboard(): Promise<JSX.Element> {
  const vendorId = 3;
  const data = await getVendorDashboardData(vendorId);
  console.log(data, "DATA")

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
          <p className="text-2xl font-bold text-gray-900">{data.totalOrders}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Active Rentals</h3>
          <p className="text-2xl font-bold text-gray-900">{data.activeRentals}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">₹{data.totalRevenue}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Inventory Items</h3>
          <p className="text-2xl font-bold text-gray-900">{data.inventoryItems}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>

        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-600">No orders yet</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.recentOrders.map(order => (
              <li key={order.id}>
                <Link
                  href={`/vendor/orders/${order.id}`}
                  className="py-3 flex items-center justify-between hover:bg-gray-50 rounded-md -mx-2 px-2 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      Order #{order.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${order.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : order.status === "CONFIRMED"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-100 text-red-700"
                      }`}
                  >
                    {order.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
