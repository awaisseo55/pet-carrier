import type { TocEntry } from "@/lib/toc";

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 3) return null;

  return (
    <details className="group rounded-lg border border-border bg-gray-50 p-5 open:pb-5" open>
      <summary className="cursor-pointer list-none font-heading text-sm font-semibold uppercase tracking-wide text-foreground marker:content-none">
        Contents
      </summary>
      <ul className="mt-3 flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? "ml-4" : ""}>
            <a href={`#${entry.id}`} className="text-sm text-blue-700 hover:underline">
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
