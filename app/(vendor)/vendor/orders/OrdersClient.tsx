"use client";

import { useState } from "react";
import type { OrderBoardData } from "@/types/order";
import { ViewToggle } from "./ViewToggle";
import { OrderListView } from "@/components/order/OrderListView";
import { QuotationCardView } from "@/components/order/QuotationCardView";
import { QuotationListView } from "@/components/order/QuotationListView";
import { QuotationStatus } from "@/generated/prisma/enums";
import { OrderCardView } from "@/components/order/OrderCardView";

type ViewMode = "card" | "list";
type DataMode = "order" | "quotation";

interface OrdersClientProps {
  orders: OrderBoardData[];
  quotations: ({
    customer: {
      name: string;
      email: string;
      id: number;
    };
    items: ({
      variant: {
        product: {
          name: string;
          id: number;
        };
      } & {
        id: number;
        quantity: number;
        productId: number;
        sku: string | null;
        costPrice: number;
        salePrice: number;
      };
    } & {
      id: number;
      quotationId: number;
      variantId: number;
      quantity: number;
      rentalStart: Date;
      rentalEnd: Date;
      price: number;
    })[];
  } & {
    id: number;
    customerId: number;
    status: QuotationStatus;
    createdAt: Date;
    updatedAt: Date;
    vendorId: number;
    couponId: number | null;
  })[];
}

export function OrdersClient({ orders, quotations }: OrdersClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [dataMode, setDataMode] = useState<DataMode>("order");

  return (
    <div className="space-y-6">
      <div className="hidden md:flex justify-between">
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setDataMode("order")}
            className={`px-4 py-2 rounded-md ${
              dataMode === "order" ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setDataMode("quotation")}
            className={`px-4 py-2 rounded-md ${
              dataMode === "quotation" ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            Quotations
          </button>
        </div>
      </div>

      {viewMode === "card" && dataMode === "order" && (
        <OrderCardView orders={orders} />
      )}

      {viewMode === "list" && dataMode === "order" && (
        <OrderListView orders={orders} />
      )}

      {viewMode === "card" && dataMode === "quotation" && (
        <QuotationCardView quotations={quotations} />
      )}

      {viewMode === "list" && dataMode === "quotation" && (
        <QuotationListView quotations={quotations} />
      )}
    </div>
  );
}
