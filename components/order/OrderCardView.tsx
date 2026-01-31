"use client";

import { useMemo } from "react";
import type { OrderBoardData, OrderCardData } from "@/types/order";
import type { OrderStatus, InvoiceStatus } from "@/generated/prisma/enums";
import { OrderCard } from "./OrderCard";

interface Props {
  orders: OrderBoardData[];
}

export function OrderCardView({ orders }: Props) {
  const cards = useMemo<OrderCardData[]>(() => {
    return orders.map((order) => {
      let displayStatus: OrderCardData["displayStatus"] = "Sale Order";

      if (order.status === "CANCELLED") displayStatus = "Cancelled";
      else if (order.invoice?.status === "PAID") displayStatus = "Invoiced";
      else if (order.status === "CONFIRMED") displayStatus = "Confirmed";

      return {
        id: `order-${order.id}`,
        type: "order",
        reference: `S${String(order.id).padStart(5, "0")}`,
        customerName: order.customer.name,
        productName:
          order.items[0]?.variant?.product?.name || "Multiple Products",
        totalAmount: order.invoice?.totalAmount || 0,
        rentalStart: order.items[0]?.rentalStart,
        rentalEnd: order.items[0]?.rentalEnd,
        createdAt: order.createdAt,
        displayStatus,
        orderStatus: order.status as OrderStatus,
        invoiceStatus: order.invoice?.status as InvoiceStatus | undefined,
        orderData: order,
      };
    });
  }, [orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {cards.map((card) => (
        <OrderCard key={card.id} cardData={card} />
      ))}
    </div>
  );
}
