import type { OrderStatus } from "./types";

/**
 * Pure decision logic for whether a customer notification email can be sent
 * right now, kept separate from the API route so it's directly unit-testable
 * without mocking the whole request/response cycle. Notifications are no
 * longer an automatic side effect of a status change (see the "Order
 * management" section of CLAUDE.md for why): the admin explicitly clicks a
 * "Send notification" button on the order detail page, and this just gates
 * that the order is actually in the matching status and nothing has been
 * sent for it yet, so a double-click (or a second tab open on the same
 * order) can't send the same email twice.
 */

export type OrderNotificationType = "dispatched" | "cancelled" | "delivered";

export function canSendOrderNotification(params: {
  status: OrderStatus;
  type: OrderNotificationType;
  alreadySentAt?: string;
}): boolean {
  if (params.alreadySentAt) return false;
  return params.status === params.type;
}
