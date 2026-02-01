import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getVendorInvoices } from "./action";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function VendorInvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/vendor/invoices");
  if (user.role !== "VENDOR") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-4 text-gray-600">Only vendors can view invoices.</p>
      </div>
    );
  }

  const { data, total } = await getVendorInvoices({ page: 1, limit: 20 });
  return (
    <InvoicesClient initialData={data} initialTotal={total} />
  );
}
