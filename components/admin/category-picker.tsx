"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CATEGORIES, SECTIONS } from "@/lib/categories";

export function CategoryPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (paths: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");

  function toggle(path: string) {
    onChange(selected.includes(path) ? selected.filter((p) => p !== path) : [...selected, path]);
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(q)) : CATEGORIES;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="pl-9"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((path) => {
            const node = CATEGORIES.find((c) => c.path === path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => toggle(path)}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer"
              >
                {node?.name || path} &times;
              </button>
            );
          })}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
        {SECTIONS.map((section) => {
          const nodes = filtered.filter((c) => c.section === section.value);
          if (nodes.length === 0) return null;
          return (
            <div key={section.value} className="border-b border-border last:border-0">
              <p className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.name}
              </p>
              <div className="flex flex-col gap-1 p-2">
                {nodes.map((node) => (
                  <label
                    key={node.path}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                    style={{ paddingLeft: `${(node.level - 1) * 16 + 8}px` }}
                  >
                    <Checkbox checked={selected.includes(node.path)} onCheckedChange={() => toggle(node.path)} />
                    <span>{node.name}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">No categories match your search.</p>
        )}
      </div>
    </div>
  );
}
