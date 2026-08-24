import { NextResponse } from "next/server";
import { isCodEnabled } from "@/lib/feature-flags";
import { calculateCheckout, CheckoutValidationError, type CheckoutLine } from "@/lib/checkout-calculation";
import { validateCustomer, validateAddress } from "@/lib/checkout-validation";
import { createOrder, updateOrder } from "@/lib/orders";
import { incrementCouponUsage } from "@/lib/coupons";
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail } from "@/lib/email";
import type { DeliveryOption } from "@/lib/types";

interface CodRequestBody {
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

export async function POST(request: Request) {
  // Feature-flagged off: behave as if this route doesn't exist rather than
  // explaining why, matching "the COD option must not appear" in spirit.
  if (!isCodEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body: CodRequestBody = await request.json();

    const customer = validateCustomer(body.customer || {}, { requirePhone: true });
    const address = validateAddress(body.address || {}, { ukOnly: true });

    const calculated = await calculateCheckout({
      lines: body.lines,
      deliveryOption: body.deliveryOption,
      couponCode: body.couponCode,
    });

    const now = new Date().toISOString();
    const order = await createOrder({
      payment_method: "cash_on_delivery",
      // Deliberately no stripe_session_id, this order never touches Stripe.
      customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        county: address.county,
        postcode: address.postcode,
        country: address.country,
        delivery_instructions: address.instructions,
      },
      items: calculated.items,
      delivery_option: calculated.deliveryOption,
      coupon_code: calculated.appliedCouponCode,
      discount: calculated.discount,
      subtotal: calculated.subtotal,
      shipping_cost: calculated.shippingCost,
      vat: calculated.vat,
      total: calculated.total,
      status: "pending_payment",
      payment_status: "pending",
      created_at: now,
      updated_at: now,
    });

    if (calculated.appliedCouponCode) {
      await incrementCouponUsage(calculated.appliedCouponCode);
    }

    const [confirmationSent, ownerNotified] = await Promise.all([
      sendOrderConfirmationEmail(order),
      sendOwnerNewOrderEmail(order),
    ]);
    const markers: Record<string, string> = {};
    if (confirmationSent) markers.confirmation_email_sent_at = new Date().toISOString();
    if (ownerNotified) markers.owner_notification_sent_at = new Date().toISOString();
    if (Object.keys(markers).length > 0) {
      await updateOrder(order.id, markers);
    }

    return NextResponse.json({
      orderId: order.id,
      total: order.total,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      deliveryOption: order.delivery_option,
      customerFirstName: customer.firstName,
    });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Cash on delivery checkout error", error);
    return NextResponse.json({ error: "Could not place your order. Please try again." }, { status: 500 });
  }
}
