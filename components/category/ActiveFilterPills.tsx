"use client";

import { X } from "lucide-react";

export interface FilterPill {
  key: string;
  label: string;
}

interface ActiveFilterPillsProps {
  pills: FilterPill[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterPills({ pills, onRemove, onClearAll }: ActiveFilterPillsProps) {
  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <button
          key={pill.key}
          type="button"
          onClick={() => onRemove(pill.key)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
        >
          {pill.label}
          <X className="size-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
      >
        Clear all filters
      </button>
    </div>
  );
}
