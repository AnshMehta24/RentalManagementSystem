"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";

async function getCustomerId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") throw new Error("Unauthorized");
  return parseInt(user.id, 10);
}

export async function getWishlistProductIds(): Promise<number[]> {
  try {
    const customerId = await getCustomerId();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: customerId },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  } catch {
    return [];
  }
}

export async function getWishlistCount(): Promise<number> {
  try {
    const customerId = await getCustomerId();
    return prisma.wishlistItem.count({
      where: { userId: customerId },
    });
  } catch {
    return 0;
  }
}

export type WishlistProduct = {
  id: number;
  name: string;
  description: string | null;
  image: string;
  price: string;
  vendorName: string;
  inStock: boolean;
  productId: number;
};

export async function getWishlist(): Promise<WishlistProduct[]> {
  try {
    const customerId = await getCustomerId();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: customerId },
      include: {
        product: {
          include: {
            vendor: { select: { name: true, companyName: true } },
            variants: {
              take: 1,
              include: {
                prices: { take: 1, include: { period: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return items.map((wi) => {
      const p = wi.product;
      const v = p.variants[0];
      const rentalPrice = v?.prices[0];
      const unitLabel = rentalPrice?.period.unit?.toLowerCase().replace("_", " ") ?? "period";
      return {
        id: wi.id,
        productId: p.id,
        name: p.name,
        description: p.description,
        image: `https://picsum.photos/seed/${p.id}/400/300`,
        price: rentalPrice ? `Rs.${rentalPrice.price} / per ${unitLabel}` : "Price on request",
        vendorName: p.vendor.companyName ?? p.vendor.name,
        inStock: p.variants.some((variant) => variant.quantity > 0),
      };
    });
  } catch {
    return [];
  }
}

export async function addToWishlist(
  productId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();
    const product = await prisma.product.findFirst({
      where: { id: productId, published: true, isRentable: true },
    });
    if (!product) return { success: false, error: "Product not found" };
    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: { userId: customerId, productId },
      },
      create: { userId: customerId, productId },
      update: {},
    });
    revalidatePath("/wishlist");
    revalidatePath("/products");
    revalidatePath("/products/[id]");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add to wishlist",
    };
  }
}

export async function removeFromWishlist(
  productId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();
    await prisma.wishlistItem.deleteMany({
      where: { userId: customerId, productId },
    });
    revalidatePath("/wishlist");
    revalidatePath("/products");
    revalidatePath("/products/[id]");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to remove from wishlist",
    };
  }
}

export async function removeWishlistItemById(
  wishlistItemId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = await getCustomerId();
    await prisma.wishlistItem.deleteMany({
      where: { id: wishlistItemId, userId: customerId },
    });
    revalidatePath("/wishlist");
    revalidatePath("/products");
    revalidatePath("/products/[id]");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to remove from wishlist",
    };
  }
}
