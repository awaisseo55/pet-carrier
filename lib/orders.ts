import "server-only";
import { nanoid } from "nanoid";
import type { Order, OrderStatus } from "./types";
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

export async function createOrder(order: Omit<Order, "id">): Promise<Order> {
  const orders = await getAllOrders();
  const newOrder: Order = { ...order, id: nanoid(10) };
  orders.push(newOrder);
  await saveAllOrders(orders);
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const orders = await getAllOrders();
  const order = orders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
    await saveAllOrders(orders);
  }
}
