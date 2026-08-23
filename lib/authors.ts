import { slugify } from "./utils";

/**
 * Static author registry for blog bylines. Mirrors the code-configured
 * pattern used for the category taxonomy (lib/categories.ts): there's no
 * admin CRUD for authors, add an entry here when a new byline is needed.
 * Genuinely describe who's writing rather than implying credentials nobody
 * on the team holds, see CLAUDE.md's "never make unsupported claims" rule.
 */
export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
}

export const AUTHORS: Author[] = [
  {
    slug: "pet-carrier-team",
    name: "Pet Carrier Team",
    role: "Pet Carrier",
    bio: "The Pet Carrier team researches and writes our buying guides and pet care articles, drawing on the specifications and features of the carriers, strollers and beds we sell to give practical, honest advice. We're a UK-based pet retailer, not a veterinary practice, so anything touching on your pet's health or behaviour is written as general guidance rather than medical advice, and reviewed for accuracy before publishing.",
  },
];

export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

export function getAuthorByName(name: string): Author | undefined {
  const slug = slugify(name);
  return AUTHORS.find((a) => a.slug === slug);
}

export function authorSlug(name: string): string {
  return slugify(name);
}
