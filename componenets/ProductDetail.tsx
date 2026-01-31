"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import Header from "./Header";
import { addToCart } from "@/app/(customer)/actions/cart";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/app/(customer)/actions/wishlist";

export interface PriceOption {
  periodName: string;
  unit: string;
  price: number;
  priceLabel: string;
}

export interface AttributeOption {
  id: number;
  name: string;
  displayType: string;
  values: { id: number; value: string; extraPrice: number }[];
}

export interface VariantOption {
  id: number;
  sku: string | null;
  quantity: number;
  salePrice: number;
  priceOptions: PriceOption[];
  attributeValueByAttributeId: Record<number, number>;
}

export interface ProductDetailData {
  id: number;
  name: string;
  description: string | null;
  image: string;
  sku: string | null;
  priceOptions: PriceOption[];
  inStock: boolean;
  quantity: number;
  attributeOptions: AttributeOption[];
  variants: VariantOption[];
  initialInWishlist?: boolean;
}

interface ProductDetailProps {
  product: ProductDetailData;
}

const COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  white: "#f1f5f9",
  black: "#1e293b",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  gray: "#6b7280",
  brown: "#92400e",
};

function getColorHex(value: string): string {
  const key = value.toLowerCase().replace(/\s+/g, "");
  return COLOR_HEX[key] ?? "#94a3b8";
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>(
    () => {
      const first = product.variants[0];
      if (!first) return {};
      const initial: Record<number, number> = {};
      for (const [attrId, valueId] of Object.entries(
        first.attributeValueByAttributeId,
      )) {
        initial[Number(attrId)] = valueId;
      }
      return initial;
    },
  );
  const [quantity, setQuantity] = useState(1);
  const [rentalStart, setRentalStart] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [rentalEnd, setRentalEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [addToCartPending, setAddToCartPending] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [inWishlist, setInWishlist] = useState(
    product.initialInWishlist ?? false,
  );
  const [wishlistPending, setWishlistPending] = useState(false);
  const router = useRouter();

  const selectedVariant = useMemo(() => {
    return product.variants.find((v) => {
      const keys = Object.keys(v.attributeValueByAttributeId).map(Number);
      if (keys.length !== Object.keys(selectedValues).length) return false;
      return keys.every(
        (attrId) =>
          v.attributeValueByAttributeId[attrId] === selectedValues[attrId],
      );
    });
  }, [product.variants, selectedValues]);

  const currentSku = selectedVariant?.sku ?? product.sku;
  const currentPriceOptions =
    selectedVariant?.priceOptions ?? product.priceOptions;
  const currentQuantity = selectedVariant?.quantity ?? product.quantity;
  const currentInStock = selectedVariant
    ? selectedVariant.quantity > 0
    : product.inStock;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) {
      const d = new Date(v);
      setRentalStart(d);
      if (d >= rentalEnd) {
        const end = new Date(d);
        end.setDate(end.getDate() + 1);
        setRentalEnd(end);
      }
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) setRentalEnd(new Date(v));
  };

  const setAttributeValue = (attributeId: number, valueId: number) => {
    setSelectedValues((prev) => ({ ...prev, [attributeId]: valueId }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header showSearch />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <nav className="mb-6 text-sm text-(--foreground)/70">
          <Link href="/products" className="hover:text-(--accent) transition">
            All Product
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="relative aspect-square lg:aspect-4/3 rounded-lg border border-(--border) bg-(--card-bg) overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {!currentInStock && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                <span className="text-white font-semibold px-4 py-2 rounded-lg border border-white/30">
                  Out of stock
                </span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h1>
            <p className="text-sm text-(--foreground)/60 mb-3">
              {currentSku ? `R00/${currentSku}` : "—"}
            </p>
            <p className="text-sm text-(--foreground)/80 mb-4">
              (Price for the product / per hour / per day / per night / per
              week)
            </p>

            {/* Attribute options (variants) */}
            {product.attributeOptions.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.attributeOptions.map((attr) => (
                  <div key={attr.id}>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      {attr.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((val) => {
                        const isSelected = selectedValues[attr.id] === val.id;
                        const displayType =
                          attr.displayType?.toUpperCase() ?? "PILLS";

                        if (
                          displayType === "IMAGE" ||
                          (attr.name.toLowerCase() === "color" &&
                            displayType === "PILLS")
                        ) {
                          const hex = getColorHex(val.value);
                          return (
                            <button
                              key={val.id}
                              type="button"
                              onClick={() => setAttributeValue(attr.id, val.id)}
                              className={`w-9 h-9 rounded-full border-2 shrink-0 transition ${
                                isSelected
                                  ? "border-(--accent) ring-2 ring-(--accent)/30"
                                  : "border-(--border) hover:border-(--foreground)/50"
                              }`}
                              style={{ backgroundColor: hex }}
                              title={val.value}
                              aria-label={`${attr.name}: ${val.value}`}
                            />
                          );
                        }

                        if (displayType === "RADIO") {
                          return (
                            <label
                              key={val.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                                isSelected
                                  ? "border-(--accent) bg-(--accent)/10 text-(--accent)"
                                  : "border-(--border) hover:bg-(--card-bg)"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`attr-${attr.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setAttributeValue(attr.id, val.id)
                                }
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">
                                {val.value}
                                {val.extraPrice > 0 && (
                                  <span className="text-(--foreground)/60 ml-1">
                                    (+Rs.{val.extraPrice})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        }

                        if (displayType === "CHECKBOX") {
                          return (
                            <label
                              key={val.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                                isSelected
                                  ? "border-(--accent) bg-(--accent)/10 text-(--accent)"
                                  : "border-(--border) hover:bg-(--card-bg)"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`attr-${attr.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setAttributeValue(attr.id, val.id)
                                }
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">
                                {val.value}
                                {val.extraPrice > 0 && (
                                  <span className="text-[var(--foreground)]/60 ml-1">
                                    (+Rs.{val.extraPrice})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        }

                        // PILLS (default)
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => setAttributeValue(attr.id, val.id)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                              isSelected
                                ? "border-(--accent) bg-[var(--accent)]/10 text-[var(--accent)]"
                                : "border-[var(--border)] hover:bg-(--card-bg)"
                            }`}
                          >
                            {val.value}
                            {val.extraPrice > 0 && (
                              <span className="text-[var(--foreground)]/60 ml-1">
                                (+Rs.{val.extraPrice})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {currentPriceOptions.map((opt) => (
                <span
                  key={opt.periodName}
                  className="inline-block px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--accent)]"
                >
                  ₹ {opt.price} / {opt.priceLabel}
                </span>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Rental Period
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="flex-1">
                  <input
                    type="datetime-local"
                    value={rentalStart.toISOString().slice(0, 16)}
                    onChange={handleStartChange}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
                <span className="hidden sm:inline text-[var(--foreground)]/50">
                  →
                </span>
                <div className="flex-1">
                  <input
                    type="datetime-local"
                    value={rentalEnd.toISOString().slice(0, 16)}
                    onChange={handleEndChange}
                    min={rentalStart.toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center bg-[var(--card-bg)] hover:bg-[var(--border)]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="w-12 h-10 flex items-center justify-center border-x border-[var(--border)] text-sm font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(currentQuantity, q + 1))
                  }
                  disabled={quantity >= currentQuantity}
                  className="w-10 h-10 flex items-center justify-center bg-[var(--card-bg)] hover:bg-[var(--border)]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={
                  !currentInStock || addToCartPending || !selectedVariant
                }
                onClick={async () => {
                  if (!selectedVariant) return;
                  setAddToCartError(null);
                  setAddToCartPending(true);
                  const result = await addToCart(
                    selectedVariant.id,
                    quantity,
                    rentalStart.toISOString(),
                    rentalEnd.toISOString(),
                  );
                  setAddToCartPending(false);
                  if (result.success) {
                    router.push("/cart");
                  } else {
                    setAddToCartError(result.error ?? "Failed to add to cart");
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {addToCartPending ? "Adding…" : "Add to cart"}
              </button>
              {addToCartError && (
                <p className="text-sm text-red-600 mt-1">{addToCartError}</p>
              )}
              <button
                type="button"
                disabled={wishlistPending}
                onClick={async () => {
                  setWishlistPending(true);
                  const result = inWishlist
                    ? await removeFromWishlist(product.id)
                    : await addToWishlist(product.id);
                  setWishlistPending(false);
                  if (result.success) setInWishlist(!inWishlist);
                }}
                className={`p-3 rounded-lg border transition ${
                  inWishlist
                    ? "border-red-500/50 bg-red-500/10 text-red-600"
                    : "border-[var(--border)] hover:bg-[var(--card-bg)]"
                }`}
                aria-label={
                  inWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`}
                />
              </button>
              {/* <button
                type="button"
                className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--card-bg)] transition"
                aria-label="Compare"
              >
                <GitCompare className="w-5 h-5" />
              </button> */}
            </div>

            {product.description && (
              <div className="pt-6 border-t border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Description
                </h3>
                <p className="text-sm text-[var(--foreground)]/80 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-(--border)">
          <div className="h-32 rounded-lg border border-dashed border-(--border) flex items-center justify-center text-[var(--foreground)]/40 text-sm">
            Product specifications, reviews, or related products can go here
          </div>
        </div>
      </div>
    </div>
  );
}
