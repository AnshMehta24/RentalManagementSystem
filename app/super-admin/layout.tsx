"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Settings,
  BarChart3,
  Ticket,
  Shield,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/vendors", label: "Vendors", icon: Users },
  { href: "/super-admin/products", label: "Products", icon: Package },
  { href: "/super-admin/quotations", label: "Quotations", icon: FileText },
  { href: "/super-admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/super-admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/super-admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
  { href: "/super-admin/reports", label: "Reports", icon: BarChart3 },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/super-admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <Link
            href="/super-admin"
            className="flex items-center gap-2 text-lg font-bold text-blue-600 hover:text-blue-700"
          >
            <Shield className="w-6 h-6" />
            Super Admin
          </Link>
        </div>
        <nav className="p-2 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
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
            href="/api/auth/logout?redirect=/super-admin/login"
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
