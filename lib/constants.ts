// Shown whenever a product has no images at all, e.g. a brand new draft
// that hasn't had photos added yet. See lib/placeholders.ts for the
// server-side category/hero equivalents.
export const PRODUCT_PLACEHOLDER = "/placeholders/product-placeholder.jpg";

export const DELIVERY_OPTIONS = [
  { value: "standard", label: "Standard delivery", eta: "3 to 5 working days" },
  { value: "express", label: "Express delivery", eta: "1 to 2 working days" },
  { value: "next_day", label: "Next-day delivery", eta: "Next working day" },
] as const;
