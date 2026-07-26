import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { validateCoupon } from "@/lib/coupons";
import type { CartItem, DeliveryOption } from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface CheckoutRequestBody {
  items: CartItem[];
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
    const body: CheckoutRequestBody = await request.json();
    const { items, customer, address, deliveryOption, couponCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
    }
    if (!customer?.email || !address?.line1 || !address?.postcode) {
      return NextResponse.json({ error: "Please fill in your contact and delivery details." }, { status: 400 });
    }

    const settings = await getSettings();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const shippingCostByOption: Record<DeliveryOption, number> = {
      standard: subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_shipping_cost,
      express: settings.express_shipping_cost,
      next_day: settings.next_day_shipping_cost,
    };
    const shippingCost = shippingCostByOption[deliveryOption] ?? shippingCostByOption.standard;

    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    if (couponCode) {
      const result = await validateCoupon(couponCode, subtotal);
      if (result.valid && result.discountAmount) {
        discountAmount = result.discountAmount;
        appliedCouponCode = couponCode.toUpperCase();
      }
    }

    const vat = Math.round(Math.max(0, subtotal - discountAmount) * (settings.vat_rate / (100 + settings.vat_rate)) * 100) / 100;

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
          product_data: { name: DELIVERY_LABELS[deliveryOption] || "UK Shipping" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    let discounts: import("stripe").default.Checkout.SessionCreateParams.Discount[] | undefined;
    if (discountAmount > 0 && appliedCouponCode) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: "gbp",
        duration: "once",
        name: `Promo: ${appliedCouponCode}`,
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
        cart_items: JSON.stringify(
          items.map((i) => ({ id: i.product_id, slug: i.slug, title: i.title, qty: i.quantity, price: i.price, image: i.image }))
        ),
        customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
        customer_phone: customer.phone || "",
        address_line1: address.line1,
        address_line2: address.line2 || "",
        city: address.city,
        county: address.county || "",
        postcode: address.postcode,
        country: address.country || "GB",
        delivery_instructions: address.instructions || "",
        delivery_option: deliveryOption,
        coupon_code: appliedCouponCode || "",
        discount: discountAmount.toFixed(2),
        vat: vat.toFixed(2),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
