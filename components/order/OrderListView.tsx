"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { OrderBoardData, OrderCardData } from "@/types/order";
import type { OrderStatus, InvoiceStatus } from "@/generated/prisma/enums";

interface Props {
  orders: OrderBoardData[];
}
export function OrderListView({ orders }: Props) {
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
    <div className="space-y-3">
      {cards.map((card) => {
        const orderId = card.id.replace("order-", "");
        return (
          <Link
            key={card.id}
            href={`/vendor/orders/${orderId}`}
            className="grid grid-cols-5 gap-4 items-center border rounded-lg p-4 bg-white text-sm hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">{card.customerName}</div>

            <div>{card.reference}</div>

            <div className="truncate">{card.productName}</div>

            <div className="font-semibold">
              ₹{card.totalAmount.toLocaleString("en-IN")}
            </div>

            <div className="capitalize text-gray-600">
              {card.displayStatus.toLowerCase()}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
