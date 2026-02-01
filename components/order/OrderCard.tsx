"use client";

import Link from "next/link";
import type { OrderCardData } from "@/types/order";
import { format } from "date-fns";

interface OrderCardProps {
  cardData: OrderCardData;
}

function getStatusBadgeStyle(status: OrderCardData["displayStatus"]) {
  switch (status) {
    case "Sale Order":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Quotation":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Invoiced":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function OrderCard({ cardData }: OrderCardProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const referenceLabel =
    cardData.type === "order" ? "Order Reference" : "Quotation Reference";

  const href =
    cardData.type === "order"
      ? `/vendor/orders/${cardData.id.replace("order-", "")}`
      : `/vendor/quotations/${cardData.id.replace("quotation-", "")}`;

  return (
    <Link
      href={href}
      className="block bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-base text-gray-900">
            {cardData.customerName}
          </h3>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">{referenceLabel}:</span>{" "}
          {cardData.reference}
        </div>

        <div className="text-sm text-gray-700">
          <span className="font-medium">Product:</span> {cardData.productName}
        </div>

        <div className="text-lg font-bold text-gray-900">
          {formatCurrency(cardData.totalAmount)}
        </div>

        {cardData.rentalStart && cardData.rentalEnd && (
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="font-medium mb-1">Rental Duration</div>
            <div>
              {format(new Date(cardData.rentalStart), "MMM dd, yyyy")} –{" "}
              {format(new Date(cardData.rentalEnd), "MMM dd, yyyy")}
            </div>
          </div>
        )}

        <div className="pt-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
              cardData.displayStatus,
            )}`}
          >
            {cardData.displayStatus}
          </span>
        </div>
      </div>
    </Link>
  );
}
