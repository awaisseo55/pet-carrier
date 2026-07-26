export type PetType = "dogs" | "cats" | "small-animals" | "birds";

export type Subcategory =
  | "puppies"
  | "small-dogs"
  | "medium-dogs"
  | "large-dogs"
  | "kittens"
  | "adult-cats"
  | "large-cats"
  | "rabbits"
  | "guinea-pigs"
  | "hamsters"
  | "ferrets"
  | "budgies-small-birds"
  | "parrots-large-birds";

export type TravelType =
  | "airline-approved"
  | "car-travel"
  | "public-transport"
  | "backpack-hiking"
  | "vet-visits";

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
  category: PetType;
  pet_type: PetType;
  subcategory?: Subcategory;
  travel_types?: TravelType[];
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

export type OrderStatus = "pending" | "ordered_from_amazon" | "dispatched" | "delivered" | "cancelled";

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
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  default_markup_percentage: number;
  free_shipping_threshold: number;
  standard_shipping_cost: number;
  admin_notification_email: string;
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
  read_time: string;
}

export interface CartItem {
  product_id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  stock_status: StockStatus;
}
