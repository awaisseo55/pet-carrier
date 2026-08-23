import { Check } from "lucide-react";

export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      <p className="font-heading text-sm font-semibold uppercase tracking-wide text-blue-700">Key Takeaways</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
