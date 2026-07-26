import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import type { CartItem } from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: Request) {
  // TODO: once STRIPE_SECRET_KEY is set in .env.local this will create real Checkout Sessions.
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local to enable checkout.",
      },
      { status: 503 }
    );
  }

  try {
    const { items }: { items: CartItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
    }

    const settings = await getSettings();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_shipping_cost;

    const line_items: import("stripe").default.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.title,
            images: [item.image],
            metadata: { product_id: item.product_id, slug: item.slug },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })
    );

    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "UK Shipping" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["GB"] },
      billing_address_collection: "required",
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      metadata: {
        cart_items: JSON.stringify(
          items.map((i) => ({ id: i.product_id, slug: i.slug, title: i.title, qty: i.quantity, price: i.price, image: i.image }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
