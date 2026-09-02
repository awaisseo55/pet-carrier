// Shown whenever a product has no images at all, e.g. a brand new draft
// that hasn't had photos added yet. See lib/placeholders.ts for the
// server-side category/hero equivalents.
export const PRODUCT_PLACEHOLDER = "/placeholders/product-placeholder.jpg";

// Only one delivery tier is currently offered (see checkout-calculation.ts
// for the free-over-threshold logic). DeliveryOption in lib/types.ts still
// allows "express"/"next_day" so past orders placed under the old
// multi-tier system keep displaying correctly, this constant just no
// longer offers them as a choice on checkout.
export const DELIVERY_OPTIONS = [
  { value: "standard", label: "Standard Delivery", eta: "2 to 3 working days" },
] as const;
