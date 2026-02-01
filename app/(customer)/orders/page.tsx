import { getCustomerQuotations, getCustomerOrders } from "@/app/(customer)/actions/orders";
import OrdersClient from "@/componenets/OrdersClient";
import Header from "@/componenets/Header";

export default async function OrdersPage() {
  const [quotations, orders] = await Promise.all([
    getCustomerQuotations().catch(() => []),
    getCustomerOrders().catch(() => []),
  ]);

  return (
    <>
      <Header showSearch />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Quotations & orders</h1>
          <p className="text-gray-600 text-sm mb-6">View your quotations and order history.</p>
          <OrdersClient quotations={quotations} orders={orders} />
        </div>
      </main>
    </>
  );
}
