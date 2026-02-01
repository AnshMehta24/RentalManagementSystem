"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Filter, X, Heart } from "lucide-react";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/app/(customer)/actions/wishlist";
import Header from "./Header";
import FilterSidebar from "./FilterSidebar";
import type { FilterSidebarProps } from "./FilterSidebar";

interface Product {
  id: number;
  name: string;
  description: string | null;
  image: string;
  price: string;
  category: string;
  brand: string;
  color: string;
  inStock: boolean;
  vendorId: number;
  vendorName: string;
  variant: {
    id: number;
    sku: string | null;
    quantity: number;
    salePrice: number;
  } | null;
}

interface Filters {
  brands: { id: number; name: string }[];
  colors: { name: string; hex: string }[];
  durations: { id: number; name: string }[];
}

interface ProductsClientProps {
  products: Product[];
  filters: Filters;
  initialWishlistIds?: number[];
  priceBounds?: { min: number; max: number };
  initialSearch?: string;
  initialBrandIds?: number[];
  initialColors?: string[];
  initialPriceRange?: [number, number];
}

export default function ProductsClient({
  products,
  filters,
  initialWishlistIds = [],
  priceBounds = { min: 0, max: 100000 },
  initialSearch = "",
  initialBrandIds = [],
  initialColors = [],
  initialPriceRange,
}: ProductsClientProps) {
  const pathname = usePathname();

  const clampPrice = (min: number, max: number): [number, number] => {
    const low = Math.max(priceBounds.min, Math.min(priceBounds.max, min));
    const high = Math.min(priceBounds.max, Math.max(priceBounds.min, max));
    return [low, low <= high ? high : priceBounds.max];
  };
  const defaultPriceRange: [number, number] = [
    priceBounds.min,
    priceBounds.max,
  ];
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    if (!initialBrandIds.length) return [];
    return filters.brands
      .filter((b) => initialBrandIds.includes(b.id))
      .map((b) => b.name);
  });
  const [selectedColors, setSelectedColors] = useState<string[]>(
    () => initialColors,
  );
  const [selectedDuration, setSelectedDuration] = useState("All Duration");
  const [priceRange, setPriceRange] = useState<[number, number]>(() =>
    clampPrice(
      initialPriceRange?.[0] ?? priceBounds.min,
      initialPriceRange?.[1] ?? priceBounds.max,
    ),
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(
    () => new Set(initialWishlistIds),
  );
  const [wishlistTogglingId, setWishlistTogglingId] = useState<number | null>(
    null,
  );
  const itemsPerPage = 12;

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);
  useEffect(() => {
    setSelectedBrands(
      initialBrandIds.length
        ? filters.brands
            .filter((b) => initialBrandIds.includes(b.id))
            .map((b) => b.name)
        : [],
    );
  }, [initialBrandIds.join(","), filters.brands]);
  useEffect(() => {
    setSelectedColors(initialColors);
  }, [initialColors.join(",")]);
  useEffect(() => {
    setPriceRange(
      clampPrice(
        initialPriceRange?.[0] ?? priceBounds.min,
        initialPriceRange?.[1] ?? priceBounds.max,
      ),
    );
  }, [
    initialPriceRange?.[0],
    initialPriceRange?.[1],
    priceBounds.min,
    priceBounds.max,
  ]);

  const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistTogglingId(productId);
    const inWishlist = wishlistIds.has(productId);
    const result = inWishlist
      ? await removeFromWishlist(productId)
      : await addToWishlist(productId);
    setWishlistTogglingId(null);
    if (result.success) {
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (inWishlist) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    const clamped = clampPrice(min, max);
    setPriceRange(clamped);
  };

  const handlePriceRangeCommit = (min: number, max: number) => {
    pushFilters({ priceRange: clampPrice(min, max) });
  };

  const pushFilters = (updates?: {
    search?: string;
    brandIds?: number[];
    colors?: string[];
    priceRange?: [number, number];
  }) => {
    const search = updates?.search ?? searchQuery;
    const brandIds =
      updates?.brandIds ??
      (selectedBrands.length
        ? filters.brands
            .filter((b) => selectedBrands.includes(b.name))
            .map((b) => b.id)
        : []);
    const colors = updates?.colors ?? selectedColors;
    const range = updates?.priceRange ?? priceRange;
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (brandIds.length) params.set("brand", brandIds.join(","));
    if (colors.length) params.set("color", colors.join(","));
    if (range[0] > priceBounds.min) params.set("minPrice", String(range[0]));
    if (range[1] < priceBounds.max) params.set("maxPrice", String(range[1]));
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    window.location.href = url;
  };

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(next);
    const brandIds = next.length
      ? filters.brands.filter((b) => next.includes(b.name)).map((b) => b.id)
      : [];
    pushFilters({ brandIds });
  };

  const toggleColor = (color: string) => {
    const next = selectedColors.includes(color.toLowerCase())
      ? selectedColors.filter((c) => c !== color.toLowerCase())
      : [...selectedColors, color.toLowerCase()];
    setSelectedColors(next);
    pushFilters({ colors: next });
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const clampedPriceRange: [number, number] = clampPrice(
    priceRange[0],
    priceRange[1],
  );
  const filterSidebarProps: FilterSidebarProps = {
    brands: filters.brands,
    colors: filters.colors,
    durations: filters.durations,
    selectedBrands,
    selectedColors,
    selectedDuration,
    priceRange: clampedPriceRange,
    priceBounds,
    onBrandToggle: toggleBrand,
    onColorToggle: toggleColor,
    onDurationChange: setSelectedDuration,
    onPriceRangeChange: handlePriceRangeChange,
    onPriceRangeCommit: handlePriceRangeCommit,
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => pushFilters({ search: searchQuery })}
        showSearch
      />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0 sticky top-28 self-start">
            <FilterSidebar {...filterSidebarProps} />
          </aside>

          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {paginatedProducts.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {products.length}
                </span>{" "}
                products
              </p>

              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm bg-white hover:bg-gray-100 transition"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => {
                const inWishlist = wishlistIds.has(product.id);
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition"
                  >
                    <div className="relative aspect-4/3 bg-gray-100">
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white px-3 py-1 rounded">
                            Out of stock
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(e, product.id)}
                        disabled={wishlistTogglingId === product.id}
                        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 shadow border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
                        aria-label={
                          inWishlist
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            inWishlist
                              ? "fill-red-500 text-red-500"
                              : "text-gray-500"
                          }`}
                        />
                      </button>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                        unoptimized
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold line-clamp-2">
                        {product.name}
                      </h3>

                      <p className="text-base font-semibold text-blue-600">
                        {product.price}
                      </p>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Vendor: {product.vendorName}</p>
                        {product.category && (
                          <p>Category: {product.category}</p>
                        )}
                      </div>

                      {product.variant && (
                        <p
                          className={`text-xs font-medium ${
                            product.variant.quantity > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.variant.quantity} available
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-24">
                <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  Adjust your filters or search again.
                </p>

                <button
                  onClick={() => {
                    window.location.href = pathname;
                  }}
                  className="rounded-md bg-blue-600 px-6 py-2.5 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  Clear filters
                </button>
              </div>
            )}

            {products.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 w-9 rounded border bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mx-auto" />
                </button>

                {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                  const page =
                    totalPages <= 50
                      ? i + 1
                      : currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                          ? totalPages - 4 + i
                          : currentPage - 2 + i;

                  if (page < 1) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 min-w-9 px-3 rounded text-sm ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border bg-white hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 rounded border bg-white disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4 mx-auto" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {showMobileFilters && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white border-l shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="h-8 w-8 rounded border hover:bg-gray-100"
              >
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>

            <div className="p-4">
              <FilterSidebar {...filterSidebarProps} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
