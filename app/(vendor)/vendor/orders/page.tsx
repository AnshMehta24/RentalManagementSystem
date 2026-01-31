import { JSX } from "react";
import { getOrdersForBoard, getConfirmedQuotationsWithoutOrders } from "./actions";
import { OrdersClient } from "./OrdersClient";


export default async function OrdersPage(): Promise<JSX.Element> {
  const [orders, quotations] = await Promise.all([
    getOrdersForBoard(),
    getConfirmedQuotationsWithoutOrders(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Order Board</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Manage orders from quotation to return
          </p>
        </div>
      </div>

      <OrdersClient orders={orders} quotations={quotations} />
    </div>
  );
}

