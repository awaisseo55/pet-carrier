import { X } from "lucide-react";

export function CommonMistakes({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-gray-50 p-5">
      <p className="font-heading text-base font-semibold text-foreground">Common Mistakes to Avoid</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
            <X className="mt-0.5 size-4 shrink-0 text-gray-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
