import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createOrder, getOrderBySessionId, updateOrder } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail } from "@/lib/email";
import { incrementCouponUsage } from "@/lib/coupons";
import { getProductById } from "@/lib/products";
import { variantLabel } from "@/lib/variants";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import type { DeliveryOption, OrderItem } from "@/lib/types";

/**
 * Rebuilds order line items from the actual Stripe checkout session line
 * items rather than a client-supplied or metadata-stashed list, so price and
 * quantity always match what was genuinely charged. Each line item's
 * ephemeral Stripe product carries product_id/slug/variant_sku in its own
 * metadata (set at session-creation time in the checkout route), well under
 * Stripe's 500-character-per-metadata-value limit since it's just a few
 * short identifiers, not the full title/image/affiliate-URL payload.
 * Title/image/fulfilment-link are looked up fresh from the current
 * catalogue via those identifiers, falling back to whatever Stripe itself
 * has on record if the product was since removed.
 */
async function reconstructOrderItems(sessionId: string): Promise<OrderItem[]> {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ["data.price.product"],
    limit: 100,
  });

  const items: OrderItem[] = [];
  for (const li of lineItems.data) {
    const product = li.price?.product;
    if (!product || typeof product === "string" || product.deleted) continue;

    const productId = product.metadata?.product_id;
    if (!productId) continue; // the shipping line item has no product_id, that's expected

    const variantSku = product.metadata?.variant_sku;
    const catalogueProduct = await getProductById(productId);
    const variant = variantSku ? catalogueProduct?.variants?.find((v) => v.sku === variantSku) : undefined;

    items.push({
      product_id: productId,
      slug: product.metadata?.slug || catalogueProduct?.slug || "",
      title: catalogueProduct?.title || product.name || "Item",
      image: variant?.colourImage || catalogueProduct?.images?.[0] || product.images?.[0] || PRODUCT_PLACEHOLDER,
      quantity: li.quantity || 1,
      price: (li.price?.unit_amount || 0) / 100,
      amazon_url: variant?.amazonUrl || catalogueProduct?.amazon_url || "",
      variant_sku: variantSku || undefined,
      variant_label: variant ? variantLabel(variant) : undefined,
    });
  }
  return items;
}

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
      const items = await reconstructOrderItems(session.id);
      const deliveryOption = (meta.delivery_option as DeliveryOption) || "standard";

      const order = await createOrder({
        payment_method: "card",
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
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
