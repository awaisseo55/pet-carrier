import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrderById, updateOrder } from "@/lib/orders";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { adminErrorResponse } from "@/lib/api-error";
import type { Order } from "@/lib/types";

const REFUND_EPSILON = 0.005; // guards against float rounding when comparing pounds

/**
 * Issues a genuine Stripe refund (full or partial) for a card order, never a
 * simulated/local-only status change. Cash-on-delivery orders never went
 * through Stripe so there's nothing here to refund, that has to be handled
 * as a real-world cash return outside this system. See the "Order
 * management" section of CLAUDE.md.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured, cannot process a refund." }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const amount = Number(body?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid refund amount." }, { status: 400 });
  }

  try {
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_method === "cash_on_delivery" || !order.stripe_session_id) {
      return NextResponse.json(
        { error: "This order was paid by cash on delivery, there's no Stripe payment to refund." },
        { status: 400 }
      );
    }

    if (order.payment_status !== "paid") {
      return NextResponse.json({ error: "Only a paid order can be refunded." }, { status: 400 });
    }

    const alreadyRefunded = order.refunded_amount || 0;
    const remaining = Math.round((order.total - alreadyRefunded) * 100) / 100;

    if (amount > remaining + REFUND_EPSILON) {
      return NextResponse.json(
        { error: `You can refund at most £${remaining.toFixed(2)} on this order.` },
        { status: 400 }
      );
    }

    let paymentIntentId = order.stripe_payment_intent_id;
    if (!paymentIntentId) {
      // Orders created before this field existed, look the payment intent up
      // from the checkout session instead.
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    }
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Could not find the original Stripe payment for this order." }, { status: 500 });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100),
    });

    const newRefundedAmount = Math.round((alreadyRefunded + amount) * 100) / 100;
    const updates: Partial<Order> = {
      refunded_amount: newRefundedAmount,
      refunds: [...(order.refunds || []), { id: refund.id, amount, created_at: new Date().toISOString() }],
    };
    if (newRefundedAmount >= order.total - REFUND_EPSILON) {
      updates.payment_status = "refunded";
    }

    const updated = await updateOrder(id, updates);
    return NextResponse.json({ order: updated });
  } catch (error) {
    return adminErrorResponse(error, "Could not process the refund.");
  }
}
