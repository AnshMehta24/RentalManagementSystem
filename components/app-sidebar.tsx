"use client";

import React, { useState, createContext, useContext, JSX } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/types/nav";
import { cn } from "@/lib/utils";

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { title: "Dashboard", url: "/vendor/dashboard", icon: Home },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Products", url: "/vendor/products", icon: Package },
      // { title: "Inventory", url: "/vendor/inventory", icon: Package },
      { title: "Rental Orders", url: "/vendor/orders", icon: ShoppingCart },
      { title: "Invoices", url: "/vendor/invoices", icon: FileText },
      { title: "Reports", url: "/vendor/reports", icon: BarChart3 },
    ],
  },
];

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      <div className="flex h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function AppSidebar(): JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 lg:relative lg:z-auto",
          isCollapsed ? "w-16" : "w-64",
          "hidden lg:block"
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <span className="truncate">Vendor Central</span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              {!isCollapsed && (
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.url) ?? false;
                  return (
                    <a
                      key={item.title}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground",
                        isCollapsed && "justify-center"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-medium">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        <div className="border-t p-2">
          <a
            href="/vendor/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground text-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </a>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-16 hidden h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent lg:flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      </aside>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
            <span>Vendor Central</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.url) ?? false;
                  return (
                    <a
                      key={item.title}
                      href={item.url}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-medium">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        <div className="border-t p-2">
          <a
            href="/vendor/settings"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-foreground"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </a>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

export function SidebarTrigger(): JSX.Element {
  const { setIsMobileOpen } = useSidebar();

  return (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="rounded-md p-2 hover:bg-accent lg:hidden"
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function SidebarInset({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
      {children}
    </div>
  );
}

