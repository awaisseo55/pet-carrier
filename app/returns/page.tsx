import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Returns Policy",
  description: "Our 30-day returns policy for Pet Carrier orders.",
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns Policy" updated="26 July 2026">
      <p>
        We want you and your pet to be happy with your purchase. If something isn’t right, we’re
        glad to help.
      </p>

      <h2>30-day returns</h2>
      <p>
        You can return most items within 30 days of delivery for a refund, provided they’re unused,
        in their original packaging and in a resaleable condition.
      </p>

      <h2>How to start a return</h2>
      <p>
        Email us at hello@pet-carrier.co.uk with your order number and the reason for your return.
        We’ll confirm the next steps and provide a returns address.
      </p>

      <h2>Refunds</h2>
      <p>
        Once we’ve received and checked your returned item, we’ll process your refund to the
        original payment method. This usually takes 5 to 10 working days to appear, depending on
        your bank.
      </p>

      <h2>Faulty or damaged items</h2>
      <p>
        If an item arrives faulty or damaged, please contact us as soon as possible with photos
        where you can. We’ll arrange a replacement or refund and cover the cost of returning it.
      </p>

      <h2>Your statutory rights</h2>
      <p>
        This policy is in addition to your statutory rights under UK consumer law, including your
        rights under the Consumer Rights Act 2015.
      </p>
    </LegalPage>
  );
}
