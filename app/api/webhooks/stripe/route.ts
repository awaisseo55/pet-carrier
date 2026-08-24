import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createOrder, getOrderBySessionId, updateOrder } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail } from "@/lib/email";
import { incrementCouponUsage } from "@/lib/coupons";
import type { DeliveryOption, OrderItem } from "@/lib/types";

// TODO: add STRIPE_WEBHOOK_SECRET to .env.local. Get it by running
// `stripe listen --forward-to localhost:3000/api/webhooks/stripe` locally,
// or from the Stripe Dashboard once the endpoint is registered in production.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    console.warn("Stripe webhook secret not configured. TODO: set STRIPE_WEBHOOK_SECRET.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Stripe retries webhook delivery on anything other than a 2xx
      // response, and can also occasionally deliver the same event twice.
      // Without this check a retry would create a second order (and send a
      // second pair of emails) for the same payment.
      const existing = await getOrderBySessionId(session.id);
      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const meta = session.metadata || {};
      // Reconstructed from the exact basket the server calculated at
      // checkout-session creation time (lib/checkout-calculation.ts), never
      // recomputed from anything the client could influence after the fact.
      const items: OrderItem[] = JSON.parse(meta.order_items || "[]");
      const deliveryOption = (meta.delivery_option as DeliveryOption) || "standard";

      const order = await createOrder({
        payment_method: "card",
        stripe_session_id: session.id,
        customer_name: meta.customer_name || session.customer_details?.name || "Customer",
        customer_email: session.customer_details?.email || "",
        customer_phone: meta.customer_phone || undefined,
        shipping_address: {
          line1: meta.address_line1 || "",
          line2: meta.address_line2 || undefined,
          city: meta.city || "",
          county: meta.county || undefined,
          postcode: meta.postcode || "",
          country: meta.country || "GB",
          delivery_instructions: meta.delivery_instructions || undefined,
        },
        items,
        delivery_option: deliveryOption,
        coupon_code: meta.coupon_code || undefined,
        discount: meta.discount ? Number(meta.discount) : 0,
        subtotal: meta.subtotal ? Number(meta.subtotal) : items.reduce((s, i) => s + i.price * i.quantity, 0),
        shipping_cost: meta.shipping_cost ? Number(meta.shipping_cost) : 0,
        vat: meta.vat ? Number(meta.vat) : 0,
        total: (session.amount_total || 0) / 100,
        status: "paid",
        payment_status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (meta.coupon_code) {
        await incrementCouponUsage(meta.coupon_code);
      }

      const [confirmationSent, ownerNotified] = await Promise.all([
        sendOrderConfirmationEmail(order),
        sendOwnerNewOrderEmail(order),
      ]);
      const markers: Partial<typeof order> = {};
      if (confirmationSent) markers.confirmation_email_sent_at = new Date().toISOString();
      if (ownerNotified) markers.owner_notification_sent_at = new Date().toISOString();
      if (Object.keys(markers).length > 0) {
        await updateOrder(order.id, markers);
      }
    } catch (error) {
      console.error("Failed to process checkout.session.completed", error);
      return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
