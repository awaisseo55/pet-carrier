import { slugify } from "./utils";

export interface TocEntry {
  id: string;
  label: string;
  level: 2 | 3;
}

/** Scans markdown-lite content for ## / ### headings to build a table of contents, matching the anchor ids markdown-lite.tsx assigns when rendering. */
export function extractToc(content: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = !h3 && line.match(/^##\s+(.+)$/);
    const match = h3 || h2;
    if (!match) continue;
    const label = match[1].trim();
    entries.push({ id: slugify(label), label, level: h3 ? 3 : 2 });
  }
  return entries;
}
