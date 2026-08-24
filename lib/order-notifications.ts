import type { OrderStatus } from "./types";

/**
 * Pure decision logic for whether a status-change transactional email should
 * be attempted, kept separate from the admin PATCH route so it's directly
 * unit-testable without mocking the whole request/response cycle. An email
 * is only ever sent when the status genuinely changed on this request AND
 * no marker for that email exists yet, so re-selecting the same status (or
 * any retried/duplicate update) can never resend one.
 */

const STATUSES_WITH_EMAIL: OrderStatus[] = ["dispatched", "cancelled", "delivered"];

export function shouldSendTransitionEmail(params: {
  statusChanged: boolean;
  newStatus: OrderStatus;
  alreadySentAt?: string;
}): boolean {
  if (!params.statusChanged) return false;
  if (params.alreadySentAt) return false;
  return STATUSES_WITH_EMAIL.includes(params.newStatus);
}
