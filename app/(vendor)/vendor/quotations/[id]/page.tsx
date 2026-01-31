import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuotationStepperClient from "./QuotationStepperClient";
import {
  Address,
  Attribute,
  AttributeValue,
  Coupon,
  Delivery,
  Invoice,
  OrderItem,
  Pickup,
  Product,
  ProductVariant,
  Quotation,
  QuotationItem,
  RentalOrder,
  Reservation,
  User,
  VariantAttributeValue,
} from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { quotationInclude } from "@/types/quotation";

type QuotationWithRelations = Quotation & {
  customer: Pick<User, "id" | "name" | "email" | "companyName"> & {
    addresses: Address[];
  };
  vendor: Pick<User, "id" | "name" | "companyName" | "companyLogo" | "gstin">;
  coupon: Coupon | null;
  items: (QuotationItem & {
    variant: ProductVariant & {
      product: Pick<Product, "id" | "name" | "description" | "isRentable">;
      attributes: (VariantAttributeValue & {
        attribute: Pick<Attribute, "id" | "name" | "displayType">;
        value: Pick<AttributeValue, "id" | "value" | "extraPrice">;
      })[];
    };
  })[];
  order:
    | (RentalOrder & {
        items: OrderItem[];
        invoice: Invoice | null;
        pickup: Pickup | null;
        delivery: Delivery | null;
        reservations: Reservation[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return: any | null;
      })
    | null;
};

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotationId = Number((await params).id);
  if (!Number.isInteger(quotationId) || quotationId < 1) notFound();

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/quotations/${id}`);
  }

  if (currentUser.role !== "VENDOR") {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold text-red-700">Access Denied</h1>
        <p className="mt-4 text-lg">Only vendors can view quotation details.</p>
      </div>
    );
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: quotationInclude,
  });

  if (!quotation) {
    notFound();
  }

  if (quotation.vendorId !== currentUser.id) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold text-red-700">Not Authorized</h1>
        <p className="mt-4 text-lg">
          This quotation belongs to another vendor.
        </p>
      </div>
    );
  }

  return (
    <QuotationStepperClient
      quotation={quotation as QuotationWithRelations}
      currentVendorId={currentUser.id}
    />
  );
}
