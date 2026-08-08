"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/lib/product-facets";

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  counts: Record<string, number>;
  selected: string[];
  onToggle: (value: string) => void;
  renderOption?: (option: FilterOption) => React.ReactNode;
  visibleLimit?: number;
}

/** Reusable collapsible checkbox filter section, used for both the desktop sidebar and the mobile drawer. Options past `visibleLimit` collapse behind a "+N more" link. */
export function FilterSection({
  title,
  options,
  counts,
  selected,
  onToggle,
  renderOption,
  visibleLimit = 6,
}: FilterSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  if (options.length === 0) return null;

  const visible = showAll ? options : options.slice(0, visibleLimit);
  const hiddenCount = options.length - visibleLimit;

  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left cursor-pointer"
        aria-expanded={expanded}
      >
        <span className="font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded && (
        <div className="mt-3 flex flex-col gap-1">
          {visible.map((option) => {
            const count = counts[option.value] ?? 0;
            const isChecked = selected.includes(option.value);
            const disabled = count === 0 && !isChecked;
            return (
              <label
                key={option.value}
                className={cn(
                  "-mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 hover:bg-blue-50",
                  disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isChecked}
                    disabled={disabled}
                    onCheckedChange={() => onToggle(option.value)}
                  />
                  <span className="text-sm text-foreground">{renderOption ? renderOption(option) : option.label}</span>
                </span>
                <span className="text-xs text-gray-500">{count}</span>
              </label>
            );
          })}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="mt-1 text-left text-xs font-medium text-blue-600 hover:underline cursor-pointer"
            >
              {showAll ? "Show less" : `+${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
