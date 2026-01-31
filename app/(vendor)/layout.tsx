import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/app-sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { JSX } from "react";

export default function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Vendor Central</h1>
        </header>
        <main className="p-6 overflow-y-auto scroll-hidden h-[calc(100vh-4rem)]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
