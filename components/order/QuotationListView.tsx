"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import type { QuotationStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { Edit } from "lucide-react";

interface Quotation {
  id: number;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  items: {
    id: number;
    quantity: number;
    price: number;
    rentalStart: Date;
    rentalEnd: Date;
    variant: {
      product: {
        id: number;
        name: string;
      };
    };
  }[];
  status: QuotationStatus;
  createdAt: Date;
}

interface QuotationListViewProps {
  quotations: Quotation[];
}

export function QuotationListView({ quotations }: QuotationListViewProps) {
  const rows = useMemo(() => {
    return quotations.map((quotation) => {
      const totalAmount = quotation.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const firstItem = quotation.items[0];

      return {
        id: quotation.id,
        customerName: quotation.customer.name,
        totalAmount,
        productName: firstItem?.variant.product.name ?? "Multiple Products",
        rentalStart: firstItem?.rentalStart,
        rentalEnd: firstItem?.rentalEnd,
        status: quotation.status,
        itemCount: quotation.items.length,
      };
    });
  }, [quotations]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">No quotations found</div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex gap-5 items-center">
                  <h3 className="font-semibold text-gray-900">
                    {row.customerName}
                  </h3>
                  <Link href={`/vendor/quotations/${row.id}`}>
                    <Edit className="w-4 h-4 text-gray-500 ml-auto" />
                  </Link>
                </div>
                <p className="text-sm text-gray-500">
                  Quotation #{String(row.id).padStart(5, "0")}
                </p>
              </div>

              <div className="font-bold text-gray-900">
                ₹{row.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {row.productName}
              {row.itemCount > 1 && ` +${row.itemCount - 1} more`}
            </div>

            {row.rentalStart && row.rentalEnd && (
              <div className="text-sm text-gray-600">
                Rental: {format(row.rentalStart, "MMM dd, yyyy")} –{" "}
                {format(row.rentalEnd, "MMM dd, yyyy")}
              </div>
            )}

            <div className="text-sm capitalize text-gray-700">
              Status: {row.status.toLowerCase()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
