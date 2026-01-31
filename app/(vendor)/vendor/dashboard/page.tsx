import { JSX } from "react";

export default function VendorDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your vendor dashboard. Manage your inventory, orders, and more.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Orders</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Active Rentals</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
          <p className="text-2xl font-bold">₹0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Inventory Items</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href="/vendor/inventory"
              className="block rounded-md border p-3 hover:bg-accent transition-colors"
            >
              Manage Inventory
            </a>
            <a
              href="/vendor/orders"
              className="block rounded-md border p-3 hover:bg-accent transition-colors"
            >
              View Orders
            </a>
            <a
              href="/vendor/invoices"
              className="block rounded-md border p-3 hover:bg-accent transition-colors"
            >
              View Invoices
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

