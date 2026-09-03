export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type VariantType = "size" | "colour" | "size-colour";

export interface ProductVariant {
  id: string;
  type: VariantType;
  size?: string;
  /** Display label including dimensions, e.g. "M (43x32x30cm)". */
  sizeLabel?: string;
  colour?: string;
  /** Hex colour for a plain swatch, e.g. "#8B8578". Omit to fall back to colourImage or an initial letter. */
  colourHex?: string;
  /** Product image for this colour, also swapped in as the gallery's primary image when selected. */
  colourImage?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  /** Internal fulfilment link for this specific variant, same "never reaches the client" rule as Product.amazon_url. */
  amazonUrl?: string;
  inStock: boolean;
}

/** Variant shape once amazonUrl (an internal fulfilment link) has been stripped for the client, see PublicProduct. */
export type PublicProductVariant = Omit<ProductVariant, "amazonUrl">;

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  features: string[];
  specifications: Record<string, string>;
  /** For a variant product, this is the lowest variant price ("From £X"). */
  price: number;
  compare_at_price: number | null;
  sku: string;
  stock_status: StockStatus;
  stock_count?: number;
  images: string[];
  /** Paths into lib/categories.ts CATEGORIES, e.g. "carriers/dog-carriers/small-dog-carriers". A product can belong to several. */
  category_slugs: string[];
  size_range: string;
  weight_capacity: string;
  brand: string;
  amazon_asin: string;
  amazon_url: string;
  is_active: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  markup_percentage: number;
  meta_title?: string;
  meta_description?: string;
  faqs?: { question: string; answer: string }[];
  hasVariants?: boolean;
  variantType?: VariantType;
  variants?: ProductVariant[];
  /** Cached aggregate review stats, kept in sync by lib/reviews.ts's syncProductRatingStats whenever a review is created, its status changes, or it's deleted. Undefined until the first review event (or the one-time scripts/backfill-review-ratings.mjs run). */
  averageRating?: number;
  reviewCount?: number;
  ratingBreakdown?: RatingBreakdown;
  /**
   * Category filter facets. Optional: when unset, lib/product-facets.ts
   * infers them on read from category_slugs, title, specifications and
   * variants, so older products filter correctly without a data migration.
   * Set explicitly here only when inference would get it wrong.
   */
  petTypes?: string[];
  petSizes?: string[];
  styles?: string[];
  colours?: string[];
}

/**
 * The shape of a product as it may ever reach a public "use client" component
 * (product cards, add-to-basket). Anything server-rendered as plain text is
 * already safe, but props passed across a client-component boundary get
 * serialised into the page's RSC payload, so `amazon_url` (our internal
 * fulfilment link, see CLAUDE.md) must never be part of that object, and the
 * same applies to each variant's own amazonUrl.
 */
export type PublicProduct = Omit<Product, "amazon_url" | "variants"> & {
  variants?: PublicProductVariant[];
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "ordered_from_amazon"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type DeliveryOption = "standard" | "express" | "next_day";

export interface OrderItem {
  product_id: string;
  slug: string;
  title: string;
  image: string;
  quantity: number;
  price: number;
  amazon_url: string;
  /** Set when this line is a specific variant, e.g. "PC-B0GX1PNS8V-XL-GREEN". */
  variant_sku?: string;
  /** Human-readable selection, e.g. "Size: L, Colour: Grey", for admin fulfilment. */
  variant_label?: string;
}

/** "card" is the default when reading an existing order that predates this field, see getOrderPaymentMethod() in lib/orders.ts. */
export type PaymentMethod = "card" | "cash_on_delivery";

export interface Order {
  id: string;
  /** Optional because cash-on-delivery orders never go through Stripe. Never fabricate a fake Stripe id for a COD order, leave this unset instead. */
  stripe_session_id?: string;
  /** Absent on orders created before this field existed; treat as "card", see getOrderPaymentMethod(). */
  payment_method?: PaymentMethod;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
    delivery_instructions?: string;
  };
  items: OrderItem[];
  delivery_option: DeliveryOption;
  coupon_code?: string;
  discount: number;
  subtotal: number;
  shipping_cost: number;
  vat: number;
  total: number;
  status: OrderStatus;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  /** Set by admin before or when marking an order dispatched. */
  courier_name?: string;
  tracking_number?: string;
  /** Only ever rendered as a link when it's a genuine http(s) URL, see isSafeTrackingUrl() in lib/email.ts. */
  tracking_url?: string;
  /** Set on order creation from the completed Checkout Session, so a refund never needs to re-fetch the session. Absent on orders created before this field existed or paid by cash on delivery, see the refund route's fallback lookup. */
  stripe_payment_intent_id?: string;
  /** Cumulative amount refunded so far, in pounds. Absent/0 means nothing refunded yet. payment_status only flips to "refunded" once this reaches order.total, a partial refund leaves payment_status as "paid" with this set below total. */
  refunded_amount?: number;
  /** One entry per successful Stripe refund, oldest first, for a visible audit trail on the order detail page. */
  refunds?: { id: string; amount: number; created_at: string }[];
  /**
   * Durable per-order sent-once markers so webhook retries, repeated identical
   * admin status updates, or page refreshes can never trigger a duplicate
   * transactional email. Absent means "not sent yet", never inferred from
   * order.status alone.
   */
  confirmation_email_sent_at?: string;
  owner_notification_sent_at?: string;
  dispatch_email_sent_at?: string;
  cancellation_email_sent_at?: string;
  delivered_email_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  store_name: string;
  tagline: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  default_markup_percentage: number;
  free_shipping_threshold: number;
  standard_shipping_cost: number;
  express_shipping_cost: number;
  next_day_shipping_cost: number;
  vat_rate: number;
  currency: string;
  admin_notification_email: string;
}

export interface HomepageSettings {
  hero_heading: string;
  hero_subheading: string;
  trust_badges: string[];
  featured_product_id: string | null;
  shop_by_pet_categories: string[];
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogComparisonTable {
  heading: string;
  headers: string[];
  rows: string[][];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  reviewed_by?: string;
  reviewed_by_role?: string;
  published_at: string;
  updated_at?: string;
  is_draft?: boolean;
  // Structured content blocks, rendered as dedicated components rather than
  // parsed out of `content`, see components/blog/. All optional so a post
  // can be as simple or as fully built-out as the topic warrants.
  quick_answer?: string[];
  checklist_heading?: string;
  checklist_items?: string[];
  common_mistakes?: string[];
  comparison_table?: BlogComparisonTable;
  editorial_note?: string;
  faqs?: BlogFaq[];
  related_slugs?: string[];
}

export interface CartItem {
  product_id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  stock_status: StockStatus;
  saved_for_later?: boolean;
  /** Set when the selected line is a specific variant, e.g. "PC-B0GX1PNS8V-XL-GREEN". Combined with product_id, this is a cart line's real identity, so two variants of the same product are separate lines. */
  variant_sku?: string;
  /** Human-readable selection shown in the cart, e.g. "Size: L, Colour: Grey". */
  variant_label?: string;
}

export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export type ReviewStatus = "approved" | "pending" | "rejected";

export interface Review {
  id: string;
  productId: string;
  productSlug: string;
  rating: number; // 1-5
  title?: string;
  body: string;
  authorName: string; // "Anonymous" if the reviewer chose that option
  authorEmail: string; // stored but never displayed publicly
  images: string[]; // R2 public URLs
  isVerified: boolean;
  isAnonymous: boolean;
  helpfulCount: number;
  createdAt: string; // ISO date
  status: ReviewStatus;
  /** SHA-256 of the submitting IP, internal only, used for the 1-review-per-IP-per-product-per-hour rate limit. Never sent to the client. */
  ipHash?: string;
}

/** Review shape once authorEmail and ipHash (internal-only fields) have been stripped for public display, same pattern as PublicProduct. */
export type PublicReview = Omit<Review, "authorEmail" | "ipHash">;

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ProductRatingStats {
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: RatingBreakdown;
}

export interface CategoryOverride {
  path: string;
  name?: string;
  intro?: string;
  why_choose?: string;
  sizing_guide?: string;
  meta_title?: string;
  meta_description?: string;
  image?: string;
  faqs?: { question: string; answer: string }[];
  featured_product_ids?: string[];
}
