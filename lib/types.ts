export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  features: string[];
  specifications: Record<string, string>;
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
}

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
}

export interface Order {
  id: string;
  stripe_session_id: string;
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

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  published_at: string;
  updated_at?: string;
  read_time: string;
  is_draft?: boolean;
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
