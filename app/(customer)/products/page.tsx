import ProductsClient from "@/componenets/ProductList";
import { getWishlistProductIds } from "@/app/(customer)/actions/wishlist";
import { prisma } from "@/lib/prisma";

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        published: true,
        vendorId: 3,
        isRentable: true,
      },
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

export default async function ProductsPage() {
  const [products, filters, wishlistIds] = await Promise.all([
    getProducts(),
    getFilters(),
    getWishlistProductIds().catch(() => []),
  ]);

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
      image: `https://picsum.photos/seed/${product.id}/400/300`,
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
