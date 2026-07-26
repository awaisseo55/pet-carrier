import Link from "next/link";
import React from "react";

/**
 * Minimal markdown-like renderer for admin-authored product/content copy.
 * Supports exactly what the site's product descriptions and FAQ answers
 * need: "## "/"### " headings, "- " bullet lists, blank-line-separated
 * paragraphs, and inline [text](/path) links. Deliberately not a full
 * markdown parser (no bold/italic/tables/nesting) and never touches
 * dangerouslySetInnerHTML, everything renders as real React elements built
 * from trusted, admin-entered text.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, href] = match;
    if (href.startsWith("/")) {
      parts.push(
        <Link key={`${keyPrefix}-link-${i}`} href={href} className="text-blue-600 hover:text-blue-800 hover:underline">
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={`${keyPrefix}-link-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {label}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
    i += 1;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function renderRichText(text: string): React.ReactNode[] {
  if (!text) return [];
  const blocks = text.trim().split(/\n\s*\n/);
  const nodes: React.ReactNode[] = [];

  blocks.forEach((block, blockIndex) => {
    const trimmed = block.trim();
    const key = `block-${blockIndex}`;

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h3 key={key} className="font-heading text-lg font-semibold text-foreground">
          {renderInline(trimmed.slice(4).trim(), key)}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h2 key={key} className="font-heading text-2xl font-semibold text-foreground">
          {renderInline(trimmed.slice(3).trim(), key)}
        </h2>
      );
      return;
    }

    const lines = trimmed.split("\n").map((l) => l.trim());
    if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
      nodes.push(
        <ul key={key} className="list-disc pl-5 flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <li key={`${key}-li-${i}`}>{renderInline(line.slice(2).trim(), `${key}-${i}`)}</li>
          ))}
        </ul>
      );
      return;
    }

    nodes.push(<p key={key}>{renderInline(trimmed.replace(/\n/g, " "), key)}</p>);
  });

  return nodes;
}
