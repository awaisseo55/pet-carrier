import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "UK shipping costs, dispatch times and delivery information for Pet Carrier orders.",
};

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping Information" updated="26 July 2026">
      <p>
        We dispatch every order from within the UK. Here’s what to expect once you’ve placed an
        order with us.
      </p>

      <h2>Dispatch times</h2>
      <p>
        Orders are typically packed and dispatched within 1 to 3 working days. You’ll receive a
        confirmation email as soon as your order is placed, and a further email once it’s on its
        way.
      </p>

      <h2>Delivery times</h2>
      <p>
        Once dispatched, most orders arrive within 2 to 5 working days via tracked UK courier
        services. Delivery estimates can vary during busy periods or in more remote postcodes.
      </p>

      <h2>Shipping costs</h2>
      <ul>
        <li>Free UK shipping on orders over £50</li>
        <li>A flat shipping fee applies to orders under £50, shown at checkout</li>
      </ul>

      <h2>Tracking</h2>
      <p>
        You’ll receive tracking information by email once your order has been dispatched, so you
        can follow its progress right up to your door. You can also check your order’s status
        anytime on our <Link href="/track-order">Track Order</Link> page.
      </p>

      <h2>Where we deliver</h2>
      <p>
        At present we only deliver within the United Kingdom. If you have a specific delivery
        question, please get in touch via our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
