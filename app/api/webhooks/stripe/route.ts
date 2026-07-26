import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createOrder } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendOwnerNotificationEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";

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
      const cartItems: { id: string; slug: string; title: string; qty: number; price: number; image: string }[] =
        JSON.parse(session.metadata?.cart_items || "[]");

      const settings = await getSettings();
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      const shippingCost = subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_shipping_cost;

      const shipping = session.collected_information?.shipping_details;
      const address = shipping?.address;

      const order = await createOrder({
        stripe_session_id: session.id,
        customer_name: shipping?.name || session.customer_details?.name || "Customer",
        customer_email: session.customer_details?.email || "",
        shipping_address: {
          line1: address?.line1 || "",
          line2: address?.line2 || undefined,
          city: address?.city || "",
          postcode: address?.postal_code || "",
          country: address?.country || "GB",
        },
        items: cartItems.map((item) => ({
          product_id: item.id,
          slug: item.slug,
          title: item.title,
          image: item.image,
          quantity: item.qty,
          price: item.price,
          amazon_url: "",
        })),
        subtotal,
        shipping_cost: shippingCost,
        total: (session.amount_total || 0) / 100,
        status: "pending",
        payment_status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await Promise.all([sendOrderConfirmationEmail(order), sendOwnerNotificationEmail(order)]);
    } catch (error) {
      console.error("Failed to process checkout.session.completed", error);
      return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
