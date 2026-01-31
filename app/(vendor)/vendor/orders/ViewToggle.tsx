"use client";

import { LayoutGrid, List } from "lucide-react";

type ViewMode = "card" | "list";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
      <button
        onClick={() => onViewChange("card")}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          viewMode === "card"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium">Card</span>
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          viewMode === "list"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <List className="w-4 h-4" />
        <span className="text-sm font-medium">List</span>
      </button>
    </div>
  );
}

