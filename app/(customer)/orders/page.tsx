import { getCustomerQuotations, getCustomerOrders } from "@/app/(customer)/actions/orders";
import OrdersClient from "@/componenets/OrdersClient";
import Header from "@/componenets/Header";

export default async function OrdersPage() {
  const [quotations, orders] = await Promise.all([
    getCustomerQuotations().catch(() => []),
    getCustomerOrders().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header showSearch />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Quotations & orders</h1>
        <OrdersClient quotations={quotations} orders={orders} />
      </div>
    </div>
  );
}
