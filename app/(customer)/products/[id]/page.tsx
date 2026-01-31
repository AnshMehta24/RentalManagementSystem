import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWishlistProductIds } from "@/app/(customer)/actions/wishlist";
import ProductDetail from "@/componenets/ProductDetail";
import type {
  ProductDetailData,
  AttributeOption,
  VariantOption,
} from "@/componenets/ProductDetail";

function getPriceLabel(unit: string): string {
  const u = unit?.toLowerCase() ?? "";
  if (u === "hour" || u === "hourly") return "per hour";
  if (u === "day" || u === "daily") return "per day";
  if (u === "week" || u === "weekly") return "per week";
  if (u === "month" || u === "monthly") return "per month";
  if (u === "year" || u === "yearly") return "per year";
  return `per ${u}`;
}

async function getProduct(id: number) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id,
        published: true,
        isRentable: true,
      },
      include: {
        variants: {
          include: {
            attributes: {
              include: {
                attribute: true,
                value: true,
              },
            },
            prices: {
              include: {
                period: true,
              },
            },
          },
        },
      },
    });
    return product;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (Number.isNaN(productId)) notFound();

  const [product, wishlistIds] = await Promise.all([
    getProduct(productId),
    getWishlistProductIds().catch(() => []),
  ]);
  if (!product) notFound();
  const initialInWishlist = wishlistIds.includes(product.id);

  const attributeMap = new Map<
    number,
    { id: number; name: string; displayType: string; values: { id: number; value: string; extraPrice: number }[] }
  >();

  for (const variant of product.variants) {
    for (const vav of variant.attributes) {
      const attr = vav.attribute;
      const val = vav.value;
      if (!attr.isActive || !val.isActive) continue;
      if (!attributeMap.has(attr.id)) {
        attributeMap.set(attr.id, {
          id: attr.id,
          name: attr.name,
          displayType: attr.displayType,
          values: [],
        });
      }
      const entry = attributeMap.get(attr.id)!;
      if (!entry.values.some((v) => v.id === val.id)) {
        entry.values.push({
          id: val.id,
          value: val.value,
          extraPrice: val.extraPrice,
        });
      }
    }
  }

  const attributeOptions: AttributeOption[] = Array.from(attributeMap.values());

  const variantOptions: VariantOption[] = product.variants.map((v) => {
    const attrMap: Record<number, number> = {};
    for (const vav of v.attributes) {
      attrMap[vav.attributeId] = vav.attributeValueId;
    }
    const priceOptions = v.prices.map((p) => ({
      periodName: p.period.name,
      unit: p.period.unit,
      price: p.price,
      priceLabel: getPriceLabel(p.period.unit),
    }));
    return {
      id: v.id,
      sku: v.sku,
      quantity: v.quantity,
      salePrice: v.salePrice,
      priceOptions,
      attributeValueByAttributeId: attrMap,
    };
  });

  const firstVariant = variantOptions[0];
  const inStock = variantOptions.some((v) => v.quantity > 0);
  const defaultQuantity = firstVariant?.quantity ?? 0;

  const data: ProductDetailData = {
    id: product.id,
    name: product.name,
    description: product.description,
    image: `https://picsum.photos/seed/${product.id}/800/600`,
    sku: firstVariant?.sku ?? null,
    priceOptions: firstVariant?.priceOptions ?? [],
    inStock,
    quantity: defaultQuantity,
    attributeOptions,
    variants: variantOptions,
    initialInWishlist,
  };

  return <ProductDetail product={data} />;
}
