import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using pet-carrier.co.uk and placing an order with us.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="26 July 2026">
      <p>
        These terms apply whenever you use pet-carrier.co.uk or place an order with us. By using
        our site, you agree to them.
      </p>

      <h2>Orders and pricing</h2>
      <p>
        All prices are shown in pounds sterling and include VAT where applicable. We reserve the
        right to correct pricing errors and to cancel and refund any order affected by one. Placing
        an order does not guarantee stock availability, we’ll let you know promptly if there’s an
        issue.
      </p>

      <h2>Payment</h2>
      <p>
        Payments are processed securely through Stripe. We do not store your full card details on
        our servers.
      </p>

      <h2>Product descriptions</h2>
      <p>
        We do our best to describe our products accurately, including sizing and materials. Minor
        variations in colour or packaging may occur. Please see our <a href="/disclaimer">disclaimer</a>{" "}
        for more on how we describe products.
      </p>

      <h2>Delivery</h2>
      <p>
        See our <a href="/shipping">shipping page</a> for delivery times and costs. Risk in goods
        passes to you on delivery.
      </p>

      <h2>Returns</h2>
      <p>
        See our <a href="/returns">returns policy</a> for details on returning an item.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        We are not liable for indirect or consequential losses arising from use of our products or
        website, except where such liability cannot be excluded under UK law.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of England and Wales.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to hello@pet-carrier.co.uk.</p>
    </LegalPage>
  );
}
