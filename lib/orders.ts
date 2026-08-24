import "server-only";
import { nanoid } from "nanoid";
import type { Order, OrderStatus, PaymentMethod } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";

export async function getAllOrders(): Promise<Order[]> {
  const orders = await readJsonFile<Order[]>("orders.json");
  return orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getAllOrders();
  return orders.find((o) => o.id === id);
}

export async function getOrderBySessionId(sessionId: string): Promise<Order | undefined> {
  const orders = await getAllOrders();
  return orders.find((o) => o.stripe_session_id === sessionId);
}

async function saveAllOrders(orders: Order[]): Promise<void> {
  await writeJsonFile("orders.json", orders);
}

/** Orders created before payment_method existed are all Stripe card orders, that was the only payment method available at the time. */
export function getOrderPaymentMethod(order: Order): PaymentMethod {
  return order.payment_method ?? "card";
}

export async function createOrder(order: Omit<Order, "id">): Promise<Order> {
  const orders = await getAllOrders();
  const newOrder: Order = { ...order, id: nanoid(10) };
  orders.push(newOrder);
  await saveAllOrders(orders);
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const orders = await getAllOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  order.updated_at = new Date().toISOString();
  await saveAllOrders(orders);
  return order;
}

/**
 * General-purpose order update for admin edits (tracking fields, payment
 * status) and for setting notification-sent markers. Always goes through
 * this single read-modify-write so two calls in flight can't silently
 * clobber each other's fields the way two separate saveAllOrders() calls
 * from different helpers could.
 */
export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const orders = await getAllOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  Object.assign(order, updates, { updated_at: new Date().toISOString() });
  await saveAllOrders(orders);
  return order;
}
