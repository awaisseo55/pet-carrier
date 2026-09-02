import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { calculateCheckout, CheckoutValidationError, type CheckoutLine } from "@/lib/checkout-calculation";
import { validateCustomer, validateAddress } from "@/lib/checkout-validation";
import type { DeliveryOption } from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pet-carrier.co.uk";

interface CheckoutRequestBody {
  lines: CheckoutLine[];
  customer: { firstName: string; lastName: string; email: string; phone: string };
  address: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
    instructions?: string;
  };
  deliveryOption: DeliveryOption;
  couponCode?: string;
}

const DELIVERY_LABELS: Record<DeliveryOption, string> = {
  standard: "Standard delivery (3 to 5 working days)",
  express: "Express delivery (1 to 2 working days)",
  next_day: "Next-day delivery",
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local to enable checkout.",
      },
      { status: 503 }
    );
  }

  try {
    const body: CheckoutRequestBody = await request.json();

    const customer = validateCustomer(body.customer || {}, { requirePhone: true });
    const address = validateAddress(body.address || {}, { ukOnly: false });

    const calculated = await calculateCheckout({
      lines: body.lines,
      deliveryOption: body.deliveryOption,
      couponCode: body.couponCode,
    });

    const line_items: import("stripe").default.Checkout.SessionCreateParams.LineItem[] = calculated.items.map(
      (item) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.variant_label ? `${item.title} — ${item.variant_label}` : item.title,
            images: item.image.startsWith("http") ? [item.image] : undefined,
            metadata: {
              product_id: item.product_id,
              slug: item.slug,
              ...(item.variant_sku ? { variant_sku: item.variant_sku } : {}),
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })
    );

    if (calculated.shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: { name: DELIVERY_LABELS[calculated.deliveryOption] || "UK Shipping" },
          unit_amount: Math.round(calculated.shippingCost * 100),
        },
        quantity: 1,
      });
    }

    let discounts: import("stripe").default.Checkout.SessionCreateParams.Discount[] | undefined;
    if (calculated.discount > 0 && calculated.appliedCouponCode) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(calculated.discount * 100),
        currency: "gbp",
        duration: "once",
        name: `Promo: ${calculated.appliedCouponCode}`,
      });
      discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      discounts,
      customer_email: customer.email,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      metadata: {
        // The exact server-calculated basket at the moment of checkout, this
        // is what the webhook reconstructs the order from, never the raw
        // client-sent lines, so a price change between session creation and
        // webhook delivery can't retroactively alter what was charged.
        order_items: JSON.stringify(calculated.items),
        customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
        customer_phone: customer.phone || "",
        address_line1: address.line1,
        address_line2: address.line2 || "",
        city: address.city,
        county: address.county || "",
        postcode: address.postcode,
        country: address.country,
        delivery_instructions: address.instructions || "",
        delivery_option: calculated.deliveryOption,
        coupon_code: calculated.appliedCouponCode || "",
        discount: calculated.discount.toFixed(2),
        subtotal: calculated.subtotal.toFixed(2),
        shipping_cost: calculated.shippingCost.toFixed(2),
        vat: calculated.vat.toFixed(2),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Stripe checkout session error", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
