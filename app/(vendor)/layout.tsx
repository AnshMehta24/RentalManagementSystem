"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/orders", label: "Rental Orders", icon: ShoppingCart },
  { href: "/vendor/invoices", label: "Invoices", icon: FileText },
  { href: "/vendor/reports", label: "Reports", icon: BarChart3 },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
];

export default function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <Link
            href="/vendor/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-blue-600 hover:text-blue-700"
          >
            <Package className="w-6 h-6" />
            Vendor Central
          </Link>
        </div>
        <nav className="p-2 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/vendor/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-gray-200">
          <Link
            href="/api/auth/logout?redirect=/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8 bg-gray-50">{children}</main>
    </div>
  );
}
