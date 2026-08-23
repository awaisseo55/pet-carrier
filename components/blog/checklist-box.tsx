import { Square } from "lucide-react";

export function ChecklistBox({ heading, items }: { heading?: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="font-heading text-base font-semibold text-foreground">{heading || "Quick Checklist"}</p>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
            <Square className="mt-0.5 size-4 shrink-0 text-gray-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
