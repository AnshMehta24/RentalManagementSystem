import type {
  OrderStatus,
  InvoiceStatus,
  FulfillmentType,
  QuotationStatus,
} from "@/generated/prisma/enums";

export interface OrderBoardData {
  id: number;
  quotationId: number;
  customerId: number;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  quotation: {
    id: number;
    status: QuotationStatus;
    items: Array<{
      id: number;
      quantity: number;
      rentalStart: Date;
      rentalEnd: Date;
      price: number;
      variant: {
        id: number;
        sku: string | null;
        product: {
          id: number;
          name: string;
        };
      };
    }>;
  };
  invoice: {
    id: number;
    totalAmount: number;
    paidAmount: number;
    status: InvoiceStatus;
  } | null;
  pickup: {
    id: number;
    pickedAt: Date;
  } | null;
  delivery: {
    id: number;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  items: Array<{
    id: number;
    quantity: number;
    rentalStart: Date;
    rentalEnd: Date;
    price: number;
    variant: {
      id: number;
      sku: string | null;
      product: {
        id: number;
        name: string;
      };
    };
  }>;
}

export type OrderCardData =
  | {
      id: string;
      type: "quotation";
      reference: string;
      customerName: string;
      productName: string;
      totalAmount: number;
      rentalStart?: Date;
      rentalEnd?: Date;
      createdAt: Date;
      displayStatus: "Quotation" | "Confirmed" | "Cancelled";
      quotationStatus: QuotationStatus;
      quotationData: unknown;
    }
  | {
      id: string;
      type: "order";
      reference: string;
      customerName: string;
      productName: string;
      totalAmount: number;
      rentalStart?: Date;
      rentalEnd?: Date;
      createdAt: Date;
      displayStatus: "Sale Order" | "Confirmed" | "Cancelled" | "Invoiced";
      orderStatus: OrderStatus;
      invoiceStatus?: InvoiceStatus;
      orderData: unknown;
    };
