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
  onBrandToggle: (brand: string) => void;
  onColorToggle: (color: string) => void;
  onDurationChange: (duration: string) => void;
  onPriceRangeChange: (min: number, max: number) => void;
}

export default function FilterSidebar({
  brands,
  colors,
  durations,
  selectedBrands,
  selectedColors,
  selectedDuration,
  priceRange,
  onBrandToggle,
  onColorToggle,
  onDurationChange,
  onPriceRangeChange,
}: FilterSidebarProps) {
  const [brandSearch, setBrandSearch] = useState("");
  const [durationOpen, setDurationOpen] = useState(false);

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="rounded-lg border border-(--border) bg-(--card-bg) p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
          Brand
          <ChevronDown className="w-4 h-4 opacity-70" />
        </h3>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--foreground)/50" />
          <input
            type="text"
            placeholder="Search brand..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-(--border) bg-background outline-none placeholder:text-(--foreground)/50 focus:border-(--accent)"
          />
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {filteredBrands.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center gap-2 cursor-pointer text-sm text-(--foreground)/90 hover:text-foreground"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.name)}
                onChange={() => onBrandToggle(brand.name)}
                className="w-4 h-4 rounded border-(--border) bg-background text-(--accent) focus:ring-(--accent)"
              />
              <span className="truncate">{brand.name}</span>
            </label>
          ))}

          {filteredBrands.length === 0 && (
            <p className="text-sm text-(--foreground)/50">No brands match</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-(--border) bg-(--card-bg) p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
          Color
          <ChevronDown className="w-4 h-4 opacity-70" />
        </h3>

        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => onColorToggle(color.name)}
              className={`w-8 h-8 rounded-full border-2 transition shrink-0 ${
                selectedColors.includes(color.name)
                  ? "border-(--accent) ring-2 ring-(--accent)/30"
                  : "border-(--border) hover:border-(--foreground)/50"
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
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Price Range
        </h3>

        <div className="space-y-6">
          <div className="relative h-10">
            <div className="absolute inset-y-0 left-0 right-0 h-2 my-auto bg-gray-200 rounded-full" />

            <div
              className="absolute inset-y-0 h-2 my-auto bg-purple-600 rounded-full pointer-events-none"
              style={{
                left: `${(priceRange[0] / 10000) * 100}%`,
                width: `${((priceRange[1] - priceRange[0]) / 10000) * 100}%`,
              }}
            />

            <input
              type="range"
              min={1}
              max={10000}
              value={priceRange[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                onPriceRangeChange(
                  Math.min(val, priceRange[1] - 1),
                  priceRange[1],
                );
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
            />

            <input
              type="range"
              min={1}
              max={10000}
              value={priceRange[1]}
              onChange={(e) => {
                const val = Number(e.target.value);
                onPriceRangeChange(
                  priceRange[0],
                  Math.max(val, priceRange[0] + 1),
                );
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
