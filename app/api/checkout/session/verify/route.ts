import { NextResponse } from "next/server";
import { getOrderBySessionId } from "@/lib/orders";

/**
 * Deliberately returns only a boolean, never order details, so the success
 * page can confirm an order was actually recorded (and only then clear the
 * cart) without creating a general "fetch order by ID" surface. A Stripe
 * Checkout Session ID is a long random token the requester must already
 * possess, this doesn't add a new way to enumerate orders.
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const order = await getOrderBySessionId(sessionId);
  return NextResponse.json({ ok: Boolean(order) });
}
