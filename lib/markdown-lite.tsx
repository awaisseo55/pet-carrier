import Link from "next/link";
import React from "react";

/**
 * Minimal markdown-like renderer for admin-authored product/content copy.
 * Supports exactly what the site's product descriptions and FAQ answers
 * need: "## "/"### " headings, "- " bullet lists, blank-line-separated
 * paragraphs, inline [text](/path) links, and **bold** emphasis (no
 * italic/tables/nesting). Never touches dangerouslySetInnerHTML, everything
 * renders as real React elements built from trusted, admin-entered text.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const inlinePattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, href, bold] = match;
    if (bold !== undefined) {
      parts.push(<strong key={`${keyPrefix}-strong-${i}`}>{bold}</strong>);
    } else if (href.startsWith("/")) {
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

    if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
      const isH3 = trimmed.startsWith("### ");
      const newlineIndex = trimmed.indexOf("\n");
      const headingLine = newlineIndex === -1 ? trimmed : trimmed.slice(0, newlineIndex);
      const rest = newlineIndex === -1 ? "" : trimmed.slice(newlineIndex + 1).trim();
      const headingText = headingLine.slice(isH3 ? 4 : 3).trim();

      if (isH3) {
        nodes.push(
          <h3 key={key} className="font-heading text-xl font-semibold text-foreground mt-6 mb-2 block">
            {renderInline(headingText, key)}
          </h3>
        );
      } else {
        nodes.push(
          <h2 key={key} className="font-heading text-2xl font-semibold text-foreground mt-6 mb-2 block">
            {renderInline(headingText, key)}
          </h2>
        );
      }

      if (rest) {
        nodes.push(<p key={`${key}-p`}>{renderInline(rest.replace(/\n/g, " "), `${key}-p`)}</p>);
      }
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
