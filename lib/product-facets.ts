/**
 * Category filter facets (pet type, size, style, colour) for the product
 * filter sidebar/drawer. A product can set these explicitly on its record,
 * but most don't need to: getProductFacets() infers them from category_slugs
 * (via CATEGORIES' own `animal`/`name` metadata), title, specifications and
 * variants, the same "derive from existing structured data" approach
 * lib/category-content.ts uses for category copy. Pure functions, no
 * server-only dependency, so this is safe to import from client filter
 * components as well as server pages.
 */
import { getCategoryByPath } from "./categories";
import type { Product, PublicProduct } from "./types";

type FacetProduct = Pick<
  Product | PublicProduct,
  | "title"
  | "features"
  | "category_slugs"
  | "specifications"
  | "weight_capacity"
  | "size_range"
  | "variants"
  | "petTypes"
  | "petSizes"
  | "styles"
  | "colours"
>;

function textOf(product: FacetProduct): string {
  return `${product.title} ${(product.features || []).join(" ")}`.toLowerCase();
}

export interface FilterOption {
  value: string;
  label: string;
}

export const PET_TYPE_OPTIONS: FilterOption[] = [
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
  { value: "rabbits", label: "Rabbits" },
  { value: "guinea-pigs", label: "Guinea Pigs" },
  { value: "hamsters", label: "Hamsters" },
  { value: "ferrets", label: "Ferrets" },
  { value: "birds", label: "Birds" },
  { value: "small-animals", label: "Small Animals" },
];

export const PET_SIZE_OPTIONS: FilterOption[] = [
  { value: "small", label: "Small (up to 5kg)" },
  { value: "medium", label: "Medium (5 to 10kg)" },
  { value: "large", label: "Large (10 to 20kg)" },
  { value: "extra-large", label: "Extra Large (20kg+)" },
];

export const STYLE_OPTIONS: FilterOption[] = [
  { value: "soft-sided", label: "Soft Sided" },
  { value: "hard-sided", label: "Hard Sided" },
  { value: "backpack", label: "Backpack" },
  { value: "sling", label: "Sling" },
  { value: "rolling", label: "Rolling / With Wheels" },
  { value: "foldable", label: "Foldable / Collapsible" },
  { value: "airline-approved", label: "Airline Approved" },
  { value: "car-compatible", label: "Car Compatible" },
];

export const PRICE_RANGE_OPTIONS: { value: string; label: string; min: number; max: number }[] = [
  { value: "under-30", label: "Under £30", min: 0, max: 30 },
  { value: "30-50", label: "£30 to £50", min: 30, max: 50 },
  { value: "50-75", label: "£50 to £75", min: 50, max: 75 },
  { value: "75-100", label: "£75 to £100", min: 75, max: 100 },
  { value: "100-plus", label: "£100+", min: 100, max: Infinity },
];

export const RATING_OPTIONS: { value: string; label: string; min: number }[] = [
  { value: "4", label: "4 stars & up", min: 4 },
  { value: "3", label: "3 stars & up", min: 3 },
  { value: "2", label: "2 stars & up", min: 2 },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Rating: High to Low" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "name", label: "Name: A to Z" },
];

const ANIMAL_TO_PET_TYPE: Record<string, string> = {
  dog: "dogs",
  cat: "cats",
  rabbit: "rabbits",
  "guinea pig": "guinea-pigs",
  hamster: "hamsters",
  ferret: "ferrets",
  reptile: "small-animals",
  bird: "birds",
  budgie: "birds",
  parrot: "birds",
  "small animal": "small-animals",
};

const COLOUR_WORDS: { word: string; value: string; label: string; hex: string }[] = [
  { word: "black", value: "black", label: "Black", hex: "#111827" },
  { word: "grey", value: "grey", label: "Grey", hex: "#9CA3AF" },
  { word: "gray", value: "grey", label: "Grey", hex: "#9CA3AF" },
  { word: "blue", value: "blue", label: "Blue", hex: "#2563EB" },
  { word: "navy", value: "blue", label: "Blue", hex: "#2563EB" },
  { word: "pink", value: "pink", label: "Pink", hex: "#EC4899" },
  { word: "purple", value: "purple", label: "Purple", hex: "#7C3AED" },
  { word: "red", value: "red", label: "Red", hex: "#DC2626" },
  { word: "beige", value: "beige", label: "Beige", hex: "#D6C7A1" },
  { word: "brown", value: "brown", label: "Brown", hex: "#78350F" },
  { word: "tan", value: "brown", label: "Brown", hex: "#78350F" },
  { word: "caramel", value: "brown", label: "Brown", hex: "#78350F" },
  { word: "green", value: "green", label: "Green", hex: "#16A34A" },
  { word: "orange", value: "orange", label: "Orange", hex: "#F97316" },
  { word: "white", value: "white", label: "White", hex: "#F9FAFB" },
  { word: "cream", value: "beige", label: "Beige", hex: "#D6C7A1" },
  { word: "charcoal", value: "grey", label: "Grey", hex: "#9CA3AF" },
];

export const COLOUR_SWATCHES: Record<string, { label: string; hex: string }> = COLOUR_WORDS.reduce(
  (acc, c) => ({ ...acc, [c.value]: { label: c.label, hex: c.hex } }),
  {}
);

function parseKg(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  return m ? parseFloat(m[1]) : null;
}

function sizeFromKg(kg: number): string {
  if (kg <= 5) return "small";
  if (kg <= 10) return "medium";
  if (kg <= 20) return "large";
  return "extra-large";
}

function inferPetTypes(product: FacetProduct): string[] {
  const found = new Set<string>();
  for (const path of product.category_slugs) {
    const node = getCategoryByPath(path);
    if (node && ANIMAL_TO_PET_TYPE[node.animal]) found.add(ANIMAL_TO_PET_TYPE[node.animal]);
  }
  if (found.size === 0) {
    const t = textOf(product);
    if (/\bdog\b|puppy|puppies/.test(t)) found.add("dogs");
    if (/\bcat\b|kitten/.test(t)) found.add("cats");
    if (/rabbit/.test(t)) found.add("rabbits");
  }
  return [...found];
}

function inferPetSizes(product: FacetProduct): string[] {
  const found = new Set<string>();
  const haystack = product.category_slugs.join(" ");
  if (/small-dog-carriers|puppy-carriers|puppy-slings|kitten-carriers/.test(haystack)) found.add("small");
  if (/medium-dog-carriers/.test(haystack)) found.add("medium");
  if (/large-dog-carriers|large-cat-carriers/.test(haystack)) found.add("large");

  const kgSources = [product.weight_capacity, ...Object.values(product.specifications || {})].join(" ");
  const kg = parseKg(kgSources);
  if (kg !== null) found.add(sizeFromKg(kg));

  if (product.variants) {
    for (const v of product.variants) {
      const vKg = v.sizeLabel ? parseKg(v.sizeLabel) : null;
      if (vKg !== null) found.add(sizeFromKg(vKg));
    }
  }

  if (found.size === 0) {
    const t = textOf(product);
    if (/\bxl\b|extra large/.test(t)) found.add("extra-large");
    else if (/\blarge\b/.test(t)) found.add("large");
    else if (/\bmedium\b/.test(t)) found.add("medium");
    else if (/\bsmall\b|puppy|kitten/.test(t)) found.add("small");
  }

  return [...found];
}

const STYLE_CATEGORY_MAP: { test: RegExp; value: string }[] = [
  { test: /dog-slings|cat-slings|sling-carriers/, value: "sling" },
  { test: /backpack-carriers/, value: "backpack" },
  { test: /rolling-carriers|rolling-dog-carriers/, value: "rolling" },
  { test: /airline-approved/, value: "airline-approved" },
  { test: /soft-sided-carriers/, value: "soft-sided" },
  { test: /hard-sided-carriers/, value: "hard-sided" },
  { test: /car-travel-carriers|dog-car-carriers/, value: "car-compatible" },
];

function inferStyles(product: FacetProduct): string[] {
  const found = new Set<string>();
  const haystack = product.category_slugs.join(" ");
  for (const { test, value } of STYLE_CATEGORY_MAP) {
    if (test.test(haystack)) found.add(value);
  }

  const t = textOf(product);
  if (/sling/.test(t)) found.add("sling");
  if (/backpack/.test(t)) found.add("backpack");
  if (/(roll|wheel|trolley)/.test(t)) found.add("rolling");
  if (/fold|collapsib/.test(t)) found.add("foldable");
  if (/airline|iata/.test(t)) found.add("airline-approved");
  if (/car seat|booster|car carrier|car travel/.test(t)) found.add("car-compatible");
  // Sidedness only gets tagged on clear positive evidence either way, never
  // a guessed default: mislabelling a hard-sided carrier as soft (or vice
  // versa) is worse for a shopper than the option simply being untagged.
  if (/hard.?sided|hard.?case|hard.?shell|rigid|plastic|abs shell|impossible to open/.test(t)) found.add("hard-sided");
  if (/soft.?sided|soft.?shell|oxford (cloth|fabric)|fabric carrier|collapsible fabric/.test(t)) found.add("soft-sided");

  return [...found];
}

function inferColours(product: FacetProduct): string[] {
  const found = new Set<string>();
  if (product.variants) {
    for (const v of product.variants) {
      if (!v.colour) continue;
      const lower = v.colour.toLowerCase();
      const match = COLOUR_WORDS.find((c) => lower.includes(c.word));
      if (match) found.add(match.value);
    }
  }
  const t = textOf(product);
  for (const c of COLOUR_WORDS) {
    if (new RegExp(`\\b${c.word}\\b`).test(t)) found.add(c.value);
  }
  return [...found];
}

export interface ResolvedFacets {
  petTypes: string[];
  petSizes: string[];
  styles: string[];
  colours: string[];
}

/** Returns a product's filter facets: stored values when set, otherwise inferred from its existing data. */
export function getProductFacets(product: FacetProduct): ResolvedFacets {
  return {
    petTypes: product.petTypes?.length ? product.petTypes : inferPetTypes(product),
    petSizes: product.petSizes?.length ? product.petSizes : inferPetSizes(product),
    styles: product.styles?.length ? product.styles : inferStyles(product),
    colours: product.colours?.length ? product.colours : inferColours(product),
  };
}

