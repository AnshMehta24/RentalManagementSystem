"use client";

import { useMemo } from "react";
import type { OrderCardData } from "@/types/order";
import { OrderCard } from "./OrderCard";
import type { QuotationStatus } from "@/generated/prisma/enums";

interface OrderCardViewProps {
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

export function QuotationCardView({ quotations }: OrderCardViewProps) {
  const cards = useMemo(() => {
    const cardData: OrderCardData[] = [];

    quotations.forEach((quotation) => {
      const totalAmount = quotation.items.reduce(
        (sum: number, item) => sum + item.price * item.quantity,
        0,
      );
      const productName =
        quotation.items[0]?.variant?.product?.name || "Multiple Products";

      let displayStatus: OrderCardData["displayStatus"] = "Quotation";
      if (quotation.status === "CANCELLED") {
        displayStatus = "Cancelled";
      } else if (quotation.status === "CONFIRMED") {
        displayStatus = "Confirmed";
      }

      cardData.push({
        id: `quotation-${quotation.id}`,
        type: "quotation",
        reference: `Q${String(quotation.id).padStart(5, "0")}`,
        customerName: quotation.customer.name,
        productName,
        totalAmount,
        rentalStart: quotation.items[0]?.rentalStart,
        rentalEnd: quotation.items[0]?.rentalEnd,
        createdAt: quotation.createdAt,
        displayStatus,
        quotationStatus: quotation.status as QuotationStatus,
        quotationData: quotation,
      });
    });

    return cardData.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [quotations]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {cards.map((card) => (
          <OrderCard key={card.id} cardData={card} />
        ))}
      </div>
      {cards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No quotations found</p>
        </div>
      )}
    </div>
  );
}
