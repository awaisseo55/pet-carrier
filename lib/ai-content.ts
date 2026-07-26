import "server-only";
import type { ScrapedAmazonProduct } from "./amazon";
import { CATEGORIES } from "./categories";

export interface GeneratedContent {
  title: string;
  description: string;
  short_description: string;
  meta_title: string;
  meta_description: string;
  features: string[];
  image_alt_texts: string[];
  suggested_category_slugs: string[];
}

// TODO: add ANTHROPIC_API_KEY to .env.local to enable AI-rewritten content.
// Without it, a simple rule-based fallback is used so the admin panel still
// works end to end during development.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-5";

const ANIMAL_HUB: Record<string, string> = {
  dog: "carriers/dog-carriers",
  cat: "carriers/cat-carriers",
  "small animal": "carriers/small-animal-carriers",
  bird: "carriers/bird-carriers",
};

function guessAnimal(text: string): keyof typeof ANIMAL_HUB {
  const lower = text.toLowerCase();
  if (/\bcat\b|kitten|feline/.test(lower)) return "cat";
  if (/\bbird\b|parrot|budgie|canary|cockatiel/.test(lower)) return "bird";
  if (/rabbit|guinea pig|hamster|gerbil|ferret|small animal|rodent/.test(lower)) return "small animal";
  return "dog";
}

/** Suggests one or two likely category paths from the product title/text, so the admin has a starting point rather than an empty picker. */
export function suggestCategorySlugs(text: string): string[] {
  const lower = text.toLowerCase();
  const animal = guessAnimal(text);
  const hub = ANIMAL_HUB[animal];

  const matches = CATEGORIES.filter((c) => c.parentPath === hub).filter((c) => {
    const slugWords = c.path.split("/").pop()!.replace(/-/g, " ");
    return lower.includes(slugWords) || slugWords.split(" ").some((w) => w.length > 3 && lower.includes(w));
  });

  if (matches.length > 0) return matches.slice(0, 2).map((c) => c.path);
  return [hub];
}

function fallbackContent(raw: ScrapedAmazonProduct): GeneratedContent {
  const cleanTitle = raw.title.replace(/\s+/g, " ").trim();
  const shortTitle = cleanTitle.length > 60 ? `${cleanTitle.slice(0, 57)}...` : cleanTitle;

  const description =
    raw.description ||
    `A comfortable, well-made carrier designed with your pet in mind. ${raw.bullets.join(". ")}`;

  return {
    title: cleanTitle,
    description,
    short_description: description.slice(0, 160),
    meta_title: shortTitle.slice(0, 60),
    meta_description: description.slice(0, 155),
    features: raw.bullets.length > 0 ? raw.bullets : ["Comfortable, secure design", "Built for everyday use"],
    image_alt_texts: raw.images.map((_, i) => `${cleanTitle} - image ${i + 1}`),
    suggested_category_slugs: suggestCategorySlugs(`${raw.title} ${raw.description}`),
  };
}

/**
 * Rewrites raw, Amazon-sourced product data into original, SEO-friendly
 * copy using Claude. Falls back to a simple rule-based rewrite if the API
 * key is missing or the request fails, so the admin flow never breaks.
 */
export async function generateProductContent(raw: ScrapedAmazonProduct): Promise<GeneratedContent> {
  if (!ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set, using fallback content generation. TODO: configure Claude API.");
    return fallbackContent(raw);
  }

  const prompt = `You are a copywriter for Pet Carrier, a UK pet product brand selling carriers, strollers and beds. Rewrite the following raw Amazon product data into unique, SEO-friendly content. Use British English (colour, favourite, £), a warm and professional tone, and never use em dashes or health claims. Do not copy the Amazon copy verbatim, write it fresh.

Raw title: ${raw.title}
Raw price: ${raw.price ? `£${raw.price}` : "unknown"}
Raw bullets:
${raw.bullets.map((b) => `- ${b}`).join("\n")}
Raw description: ${raw.description}

Respond with ONLY a JSON object matching this exact shape, no other text:
{
  "title": "SEO-friendly product title, under 70 characters",
  "description": "200-400 word engaging, benefits-focused description with 2-3 short paragraphs separated by \\n\\n",
  "short_description": "one or two sentence summary, under 160 characters",
  "meta_title": "under 60 characters",
  "meta_description": "under 155 characters",
  "features": ["5-7 rewritten bullet points"]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse Claude response as JSON");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: parsed.title || raw.title,
      description: parsed.description || raw.description,
      short_description: parsed.short_description || raw.description.slice(0, 160),
      meta_title: parsed.meta_title || parsed.title?.slice(0, 60) || raw.title.slice(0, 60),
      meta_description: parsed.meta_description || parsed.short_description?.slice(0, 155) || "",
      features: Array.isArray(parsed.features) && parsed.features.length > 0 ? parsed.features : raw.bullets,
      image_alt_texts: raw.images.map((_, i) => `${parsed.title || raw.title} - image ${i + 1}`),
      suggested_category_slugs: suggestCategorySlugs(`${parsed.title || raw.title} ${raw.description}`),
    };
  } catch (error) {
    console.error("Claude content generation failed, using fallback", error);
    return fallbackContent(raw);
  }
}
