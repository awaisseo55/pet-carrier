import "server-only";
import type { Order, OrderStatus } from "./types";
import { getOrderById } from "./orders";
import { isSafeTrackingUrl } from "./email";

export interface PublicOrderTracking {
  id: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  items: { title: string; quantity: number; image: string }[];
  total: number;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
}

/** Case-insensitive so "Jane@Example.com" at checkout still matches "jane@example.com" typed here. */
export function matchesOrderEmail(order: Order, email: string): boolean {
  return order.customer_email.trim().toLowerCase() === email.trim().toLowerCase();
}

/**
 * Trims an internal Order down to what's safe to hand back to an
 * unauthenticated visitor who only proved ownership via order id + email,
 * no full shipping address, phone number or payment details.
 */
export function toPublicOrderTracking(order: Order): PublicOrderTracking {
  return {
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    customer_name: order.customer_name,
    items: order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      image: item.image,
    })),
    total: order.total,
    courier_name: order.courier_name,
    tracking_number: order.tracking_number,
    tracking_url: isSafeTrackingUrl(order.tracking_url) ? order.tracking_url : undefined,
  };
}

/**
 * The order id (nanoid(10)) is already a high-entropy token the requester
 * must possess, requiring the email too on top of that is defence in depth
 * against someone guessing/brute-forcing ids, not the sole protection.
 * Returns null for both "no such order" and "wrong email" so the response
 * can't be used to confirm an order id exists.
 */
export async function findOrderForTracking(orderId: string, email: string): Promise<PublicOrderTracking | null> {
  const order = await getOrderById(orderId.trim());
  if (!order || !matchesOrderEmail(order, email)) return null;
  return toPublicOrderTracking(order);
}
