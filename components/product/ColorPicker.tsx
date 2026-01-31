"use client";

import { Check } from "lucide-react";

interface ColorPickerProps {
  colors: Array<{ id: number; value: string; hex?: string }>;
  selectedColorIds: number[];
  onSelect: (colorId: number) => void;
  onDeselect: (colorId: number) => void;
}

const colorMap: Record<string, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#10B981",
  black: "#1F2937",
  white: "#FFFFFF",
  silver: "#9CA3AF",
  gold: "#F59E0B",
  yellow: "#FBBF24",
  orange: "#F97316",
  purple: "#A855F7",
  pink: "#EC4899",
  brown: "#92400E",
  gray: "#6B7280",
  grey: "#6B7280",
};

const getColorHex = (colorName: string): string => {
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || "#6B7280";
};

export function ColorPicker({ colors, selectedColorIds, onSelect, onDeselect }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const isSelected = selectedColorIds.includes(color.id);
        const hex = color.hex || getColorHex(color.value);

        return (
          <button
            key={color.id}
            type="button"
            onClick={() => {
              if (isSelected) {
                onDeselect(color.id);
              } else {
                onSelect(color.id);
              }
            }}
            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
              isSelected
                ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                : "border-gray-300 hover:border-gray-400"
            }`}
            style={{ backgroundColor: hex }}
            title={color.value}
            aria-label={`Select ${color.value} color`}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-5 w-5 text-white drop-shadow-lg" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

