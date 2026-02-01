import ProductsClient from "@/componenets/ProductList";
import { getWishlistProductIds } from "@/app/(customer)/actions/wishlist";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export type ProductFilters = {
  search?: string;
  vendorIds?: number[];
  colorValues?: string[];
  minPrice?: number;
  maxPrice?: number;
};

async function getProducts(filters: ProductFilters = {}) {
  try {
    const where: Parameters<typeof prisma.product.findMany>[0]["where"] = {
      published: true,
      isRentable: true,
    };

    if (filters.vendorIds?.length) {
      where.vendorId = { in: filters.vendorIds };
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { vendor: { companyName: { contains: q, mode: "insensitive" } } },
        { vendor: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const variantConditions: object[] = [];
    if (typeof filters.minPrice === "number" && filters.minPrice >= 0) {
      variantConditions.push({ salePrice: { gte: filters.minPrice } });
    }
    if (typeof filters.maxPrice === "number" && filters.maxPrice > 0) {
      variantConditions.push({ salePrice: { lte: filters.maxPrice } });
    }
    if (filters.colorValues?.length) {
      variantConditions.push({
        attributes: {
          some: {
            attribute: { name: "Color", isActive: true },
            value: {
              OR: filters.colorValues.map((c) => ({
                value: { equals: c, mode: "insensitive" as const },
              })),
            },
          },
        },
      });
    }
    if (variantConditions.length) {
      where.variants = { some: { AND: variantConditions } };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
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

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getPriceBounds(): Promise<{ min: number; max: number }> {
  try {
    const agg = await prisma.productVariant.aggregate({
      where: {
        product: { published: true, isRentable: true },
      },
      _min: { salePrice: true },
      _max: { salePrice: true },
    });
    const min = agg._min.salePrice ?? 0;
    const max = agg._max.salePrice ?? 100000;
    const minF = Math.floor(Number(min));
    const maxC = Math.ceil(Number(max)) || 100000;
    return {
      min: Math.max(0, minF),
      max: Math.max(minF + 1, maxC),
    };
  } catch {
    return { min: 0, max: 100000 };
  }
}

async function getFilters() {
  try {
    const vendors = await prisma.user.findMany({
      where: {
        role: "VENDOR",
        products: {
          some: {
            published: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        companyName: true,
      },
    }); 

    const colorValues = await prisma.variantAttributeValue.findMany({
      where: {
        variant: {
          product: {
            published: true,
          },
        },
        attribute: {
          name: "Color",
          isActive: true,
        },
      },
      include: {
        value: true,
      },
    });

    const uniqueColors = Array.from(
      new Map(colorValues.map((v) => [v.value.id, v.value])).values(),
    );

    const rentalPeriods = await prisma.rentalPeriod.findMany({
      where: {
        isActive: true,
      },
    });

    return {
      vendors,
      uniqueColors,
      rentalPeriods,
    };
  } catch (error) {
    console.error("Error fetching filters:", error);
    return {
      vendors: [],
      uniqueColors: [],
      rentalPeriods: [],
    };
  }
}

function parseSearchParams(
  searchParams: { get: (key: string) => string | null }
): ProductFilters & { priceRange: [number, number] } {
  const q = searchParams.get("q")?.trim() ?? "";
  const brandParam = searchParams.get("brand");
  const brands = brandParam
    ? brandParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n))
    : undefined;
  const colorParam = searchParams.get("color");
  const colors = colorParam
    ? colorParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const min = minPrice ? parseInt(minPrice, 10) : undefined;
  const max = maxPrice ? parseInt(maxPrice, 10) : undefined;
  const priceRange: [number, number] = [
    typeof min === "number" && !Number.isNaN(min) && min >= 0 ? min : 0,
    typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 100000,
  ];
  const hasMinPrice = minPrice != null && minPrice !== "";
  const hasMaxPrice = maxPrice != null && maxPrice !== "";
  return {
    search: q || undefined,
    vendorIds: brands?.length ? brands : undefined,
    colorValues: colors?.length ? colors : undefined,
    minPrice:
      hasMinPrice && !Number.isNaN(Number(minPrice)) && Number(minPrice) >= 0
        ? Number(minPrice)
        : undefined,
    maxPrice:
      hasMaxPrice && !Number.isNaN(Number(maxPrice)) && Number(maxPrice) > 0
        ? Number(maxPrice)
        : undefined,
    priceRange,
  };
}

export default async function ProductsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await searchParamsPromise;
  const get = (key: string): string | null => {
    const v = raw?.[key];
    if (v == null) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  };

  const [products, filters, wishlistIds, priceBounds] = await Promise.all([
    getProducts(parseSearchParams({ get })),
    getFilters(),
    getWishlistProductIds().catch(() => []),
    getPriceBounds(),
  ]);

  const { priceRange: rawPriceRange } = parseSearchParams({ get });
  const initialPriceRange: [number, number] = [
    Math.max(priceBounds.min, Math.min(priceBounds.max, rawPriceRange[0])),
    Math.min(priceBounds.max, Math.max(priceBounds.min, rawPriceRange[1])),
  ];
  if (initialPriceRange[0] > initialPriceRange[1]) {
    initialPriceRange[0] = priceBounds.min;
    initialPriceRange[1] = priceBounds.max;
  }

  const transformedProducts = products.map((product) => {
    const firstVariant = product.variants[0];
    const colorAttr = firstVariant?.attributes.find(
      (a) => a.attribute.name.toLowerCase() === "color",
    );
    const rentalPrice = firstVariant?.prices[0];
    const unitLabel =
      rentalPrice?.period.unit?.toLowerCase().replace("_", " ") ?? "period";

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      image:
        product.imageUrl ||
        `https://picsum.photos/seed/${product.id}/400/300`,
      price: rentalPrice
        ? `₹ ${rentalPrice.price} / per ${unitLabel}`
        : "Price on request",
      category: product.name.split(" ")[0],
      brand: product.vendor.companyName || product.vendor.name,
      color: colorAttr?.value.value ?? "default",
      inStock: product.variants.some((v) => v.quantity > 0),
      vendorId: product.vendor.id,
      vendorName: product.vendor.name,
      variant: firstVariant
        ? {
            id: firstVariant.id,
            sku: firstVariant.sku,
            quantity: firstVariant.quantity,
            salePrice: firstVariant.salePrice,
          }
        : null,
    };
  });

  const transformedFilters = {
    brands: filters.vendors.map((v) => ({
      id: v.id,
      name: v.companyName || v.name,
    })),
    colors: filters.uniqueColors.map((val) => ({
      name: val.value.toLowerCase(),
      hex: getColorHex(val.value.toLowerCase()),
    })),
    durations: [
      { id: 0, name: "All Duration" },
      ...filters.rentalPeriods.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    ],
  };

  return (
    <ProductsClient
      products={transformedProducts}
      filters={transformedFilters}
      initialWishlistIds={wishlistIds}
      priceBounds={priceBounds}
      initialSearch={get("q") ?? ""}
      initialBrandIds={get("brand")
        ? get("brand")!
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n))
        : []}
      initialColors={get("color")
        ? get("color")!.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : []}
      initialPriceRange={initialPriceRange}
    />
  );
}

function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    purple: "#a855f7",
    orange: "#f97316",
    yellow: "#eab308",
    red: "#ef4444",
    green: "#22c55e",
    black: "#000000",
    white: "#ffffff",
    gray: "#6b7280",
    brown: "#92400e",
  };

  return colorMap[color] || "#6b7280";
}
