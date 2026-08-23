/**
 * Reading time is always computed from the actual article content rather
 * than entered manually, so it can't drift out of sync as an article is
 * edited. 200 words/minute is the commonly used average adult silent
 * reading speed.
 */
const WORDS_PER_MINUTE = 200;

function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function estimateReadingTime(...textBlocks: (string | string[] | undefined)[]): string {
  let words = 0;
  for (const block of textBlocks) {
    if (!block) continue;
    if (Array.isArray(block)) {
      words += block.reduce((sum, line) => sum + countWords(line), 0);
    } else {
      words += countWords(block);
    }
  }
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
