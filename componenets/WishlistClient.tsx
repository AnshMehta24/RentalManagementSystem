"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import {
  getWishlist,
  removeWishlistItemById,
  type WishlistProduct,
} from "@/app/(customer)/actions/wishlist";

interface WishlistClientProps {
  initialProducts: WishlistProduct[];
}

export default function WishlistClient({
  initialProducts,
}: WishlistClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (wishlistItemId: number) => {
    setRemovingId(wishlistItemId);
    const result = await removeWishlistItemById(wishlistItemId);
    setRemovingId(null);
    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== wishlistItemId));
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Your wishlist is empty
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Save products you like by clicking the heart icon on product cards.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white font-medium px-4 py-2 hover:bg-blue-700 transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition shadow-sm"
        >
          <Link href={`/products/${product.productId}`} className="block">
            <div className="relative aspect-[4/3] bg-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white px-3 py-1 rounded">
                    Out of stock
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-blue-600 font-medium">
                {product.price}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {product.vendorName}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleRemove(product.id);
            }}
            disabled={removingId === product.id}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 border border-gray-200 shadow hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
            aria-label="Remove from wishlist"
          >
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </button>
        </div>
      ))}
    </div>
  );
}
