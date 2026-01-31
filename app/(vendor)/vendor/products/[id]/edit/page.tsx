import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";
import {
  getProduct,
  getRentalPeriods,
  getVendor,
  getAttributes,
} from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const [productResult, periodsResult, vendorResult, attributesResult] =
    await Promise.all([
      getProduct(productId),
      getRentalPeriods(),
      getVendor(),
      getAttributes(),
    ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  return (
    <EditProductForm
      product={productResult.data}
      rentalPeriods={periodsResult.success ? periodsResult.data ?? [] : []}
      vendor={vendorResult.success ? vendorResult.data ?? null : null}
      attributes={attributesResult.success ? attributesResult.data ?? [] : []}
    />
  );
}
