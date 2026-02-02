"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface ColorFilter {
  name: string;
  hex: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Duration {
  id: number;
  name: string;
}

export interface FilterSidebarProps {
  brands: Brand[];
  colors: ColorFilter[];
  durations: Duration[];
  selectedBrands: string[];
  selectedColors: string[];
  selectedDuration: string;
  priceRange: [number, number];
  priceBounds?: { min: number; max: number };
  onBrandToggle: (brand: string) => void;
  onColorToggle: (color: string) => void;
  onDurationChange: (duration: string) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  onPriceRangeCommit?: (min: number, max: number) => void;
}

export default function FilterSidebar({
  brands,
  colors,
  durations,
  selectedBrands,
  selectedColors,
  selectedDuration,
  priceRange,
  priceBounds = { min: 0, max: 100000 },
  onBrandToggle,
  onColorToggle,
  onDurationChange,
  onPriceRangeChange,
  onPriceRangeCommit,
}: FilterSidebarProps) {
  const { min: priceMin, max: priceMax } = priceBounds;
  const rangeSpan = Math.max(priceMax - priceMin, 1);
  const low = Math.max(priceMin, Math.min(priceMax, priceRange[0]));
  const high = Math.min(priceMax, Math.max(priceMin, priceRange[1]));
  const safeLow = Math.min(low, high);
  let safeHigh = Math.max(low, high);
  if (safeHigh <= safeLow) safeHigh = Math.min(priceMax, safeLow + 1);
  const [brandSearch, setBrandSearch] = useState("");
  const [durationOpen, setDurationOpen] = useState(false);

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
          Brand
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </h3>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search brand..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {filteredBrands.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.name)}
                onChange={() => onBrandToggle(brand.name)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="truncate">{brand.name}</span>
            </label>
          ))}

          {filteredBrands.length === 0 && (
            <p className="text-sm text-gray-500">No brands match</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
          Color
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </h3>

        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => onColorToggle(color.name)}
              className={`w-8 h-8 rounded-full border-2 transition shrink-0 ${
                selectedColors.includes(color.name)
                  ? "border-blue-600 ring-2 ring-blue-600/30"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Select color ${color.name}`}
            />
          ))}
        </div>
      </div>

      {/* <div className="rounded-lg border border-(--border) bg-(--card-bg) p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Duration</h3>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDurationOpen(!durationOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border border-(--border) bg-background hover:border-(--foreground)/50 transition"
          >
            <span className="text-(--foreground)/90">
              {selectedDuration || "All Duration"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition ${
                durationOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {durationOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDurationOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 py-2 rounded-lg border border-(--border) bg-(--card-bg) shadow-xl z-20">
                {durations.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onDurationChange(d.name);
                      setDurationOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition ${
                      selectedDuration === d.name
                        ? "bg-(--accent)/20 text-(--accent)"
                        : "hover:bg-(--border)/50 text-(--foreground)/90"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div> */}

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Price Range
        </h3>

        <div className="space-y-6">
          <div className="relative h-10">
            <div className="absolute inset-y-0 left-0 right-0 h-2 my-auto bg-gray-200 rounded-full" />

            <div
              className="absolute inset-y-0 h-2 my-auto bg-blue-600 rounded-full pointer-events-none"
              style={{
                left: `${((safeLow - priceMin) / rangeSpan) * 100}%`,
                width: `${((safeHigh - safeLow) / rangeSpan) * 100}%`,
              }}
            />

            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.floor(Math.max(1, rangeSpan) / 500))}
              value={safeLow}
              onChange={(e) => {
                const val = Number(e.target.value);
                onPriceRangeChange(Math.min(val, safeHigh - 1), safeHigh);
              }}
              onMouseUp={() => onPriceRangeCommit?.(safeLow, safeHigh)}
              onTouchEnd={() => onPriceRangeCommit?.(safeLow, safeHigh)}
              className="absolute inset-0 w-full appearance-none bg-transparent
    [&::-webkit-slider-runnable-track]:bg-transparent
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:h-5
    [&::-webkit-slider-thumb]:w-5
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:bg-white
    [&::-webkit-slider-thumb]:border-2
    [&::-webkit-slider-thumb]:border-blue-600
    [&::-webkit-slider-thumb]:shadow-md
    [&::-webkit-slider-thumb]:cursor-pointer
    [&::-moz-range-track]:bg-transparent
    z-10"
            />

            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.floor(Math.max(1, rangeSpan) / 500))}
              value={safeHigh}
              onChange={(e) => {
                const val = Number(e.target.value);
                onPriceRangeChange(safeLow, Math.max(val, safeLow + 1));
              }}
              onMouseUp={() => onPriceRangeCommit?.(safeLow, safeHigh)}
              onTouchEnd={() => onPriceRangeCommit?.(safeLow, safeHigh)}
              className="absolute inset-0 w-full appearance-none bg-transparent
    [&::-webkit-slider-runnable-track]:bg-transparent
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:h-5
    [&::-webkit-slider-thumb]:w-5
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:bg-white
    [&::-webkit-slider-thumb]:border-2
    [&::-webkit-slider-thumb]:border-blue-600
    [&::-webkit-slider-thumb]:shadow-md
    [&::-webkit-slider-thumb]:cursor-pointer
    [&::-moz-range-track]:bg-transparent
    z-20"
            />
          </div>

          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>₹{safeLow.toLocaleString()}</span>
            <span>₹{safeHigh.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
