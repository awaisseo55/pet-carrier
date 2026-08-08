/**
 * Pure filter/sort/URL-serialisation logic for the category filter system.
 * Kept separate from lib/product-facets.ts (which only infers per-product
 * facet values) so CategoryFilters.tsx can stay focused on state and
 * rendering. No server-only dependency: this runs entirely client-side.
 */
import { getProductFacets, PRICE_RANGE_OPTIONS, RATING_OPTIONS } from "./product-facets";
import { slugify } from "./utils";
import type { PublicProduct } from "./types";

export interface ActiveFilters {
  pet: string[];
  size: string[];
  style: string[];
  use: string[];
  colour: string[];
  brand: string[];
  price: string | null;
  rating: string | null;
  sale: boolean;
  /** true = hide out-of-stock products (the default). */
  stock: boolean;
  sort: string;
}

export type MultiFilterKey = "pet" | "size" | "style" | "use" | "colour" | "brand";
export type SingleFilterKey = "price" | "rating";
export type SectionKey = MultiFilterKey | SingleFilterKey | "sale" | "stock";

export const DEFAULT_FILTERS: ActiveFilters = {
  pet: [],
  size: [],
  style: [],
  use: [],
  colour: [],
  brand: [],
  price: null,
  rating: null,
  sale: false,
  stock: true,
  sort: "featured",
};

export function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    filters.pet.length > 0 ||
    filters.size.length > 0 ||
    filters.style.length > 0 ||
    filters.use.length > 0 ||
    filters.colour.length > 0 ||
    filters.brand.length > 0 ||
    filters.price !== null ||
    filters.rating !== null ||
    filters.sale ||
    !filters.stock
  );
}

export function activeFilterCount(filters: ActiveFilters): number {
  return (
    filters.pet.length +
    filters.size.length +
    filters.style.length +
    filters.use.length +
    filters.colour.length +
    filters.brand.length +
    (filters.price ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.sale ? 1 : 0) +
    (filters.stock ? 0 : 1)
  );
}

export function fromSearchParams(searchParams: URLSearchParams): ActiveFilters {
  const list = (key: string) => {
    const raw = searchParams.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };
  return {
    pet: list("pet"),
    size: list("size"),
    style: list("style"),
    use: list("use"),
    colour: list("colour"),
    brand: list("brand"),
    price: searchParams.get("price"),
    rating: searchParams.get("rating"),
    sale: searchParams.get("sale") === "true",
    stock: searchParams.get("stock") !== "all",
    sort: searchParams.get("sort") || "featured",
  };
}

export function toSearchParams(filters: ActiveFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.pet.length) sp.set("pet", filters.pet.join(","));
  if (filters.size.length) sp.set("size", filters.size.join(","));
  if (filters.style.length) sp.set("style", filters.style.join(","));
  if (filters.use.length) sp.set("use", filters.use.join(","));
  if (filters.colour.length) sp.set("colour", filters.colour.join(","));
  if (filters.brand.length) sp.set("brand", filters.brand.join(","));
  if (filters.price) sp.set("price", filters.price);
  if (filters.rating) sp.set("rating", filters.rating);
  if (filters.sale) sp.set("sale", "true");
  if (!filters.stock) sp.set("stock", "all");
  if (filters.sort !== "featured") sp.set("sort", filters.sort);
  return sp;
}

export function toggleMultiValue(filters: ActiveFilters, key: MultiFilterKey, value: string): ActiveFilters {
  const current = filters[key];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return { ...filters, [key]: next };
}

export function toggleSingleValue(filters: ActiveFilters, key: SingleFilterKey, value: string): ActiveFilters {
  return { ...filters, [key]: filters[key] === value ? null : value };
}

export function toggleBoolean(filters: ActiveFilters, key: "sale" | "stock"): ActiveFilters {
  return { ...filters, [key]: !filters[key] };
}

/**
 * Whether a product matches the given filters. Pass `exclude` to skip one
 * section's own criteria, used to compute "how many results if I also
 * picked this option" counts per filter section.
 */
export function productMatchesFilters(product: PublicProduct, filters: ActiveFilters, exclude?: SectionKey): boolean {
  const facets = getProductFacets(product);

  if (exclude !== "pet" && filters.pet.length && !filters.pet.some((v) => facets.petTypes.includes(v))) return false;
  if (exclude !== "size" && filters.size.length && !filters.size.some((v) => facets.petSizes.includes(v))) return false;
  if (exclude !== "style" && filters.style.length && !filters.style.some((v) => facets.styles.includes(v))) return false;
  if (exclude !== "use" && filters.use.length && !filters.use.some((v) => facets.useCases.includes(v))) return false;
  if (exclude !== "colour" && filters.colour.length && !filters.colour.some((v) => facets.colours.includes(v))) return false;
  if (exclude !== "brand" && filters.brand.length && !filters.brand.includes(slugify(product.brand))) return false;

  if (exclude !== "price" && filters.price) {
    const range = PRICE_RANGE_OPTIONS.find((r) => r.value === filters.price);
    if (range && !(product.price >= range.min && product.price < range.max)) return false;
  }

  if (exclude !== "rating" && filters.rating) {
    const option = RATING_OPTIONS.find((r) => r.value === filters.rating);
    if (option && (product.averageRating ?? 0) < option.min) return false;
  }

  if (exclude !== "sale" && filters.sale) {
    if (!(product.compare_at_price && product.compare_at_price > product.price)) return false;
  }

  if (exclude !== "stock" && filters.stock) {
    if (product.stock_status === "out_of_stock") return false;
  }

  return true;
}

export function sortProducts(products: PublicProduct[], sort: string): PublicProduct[] {
  const arr = [...products];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "newest":
      return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "rating":
      return arr.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    case "reviews":
      return arr.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case "name":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return arr; // "featured": keep the order the caller already curated
  }
}
