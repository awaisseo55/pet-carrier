import type { PetType } from "./types";

export const PET_TYPES: { value: PetType; label: string }[] = [
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
  { value: "small-animals", label: "Small Animals" },
  { value: "birds", label: "Birds" },
];

// Shown whenever a product has no images at all, e.g. a brand new draft
// that hasn't had photos added yet. See lib/placeholders.ts for the
// server-side category/hero equivalents.
export const PRODUCT_PLACEHOLDER = "/placeholders/product-placeholder.jpg";
