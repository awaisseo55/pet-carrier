import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Pet Carrier collects, uses and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="26 July 2026">
      <p>
        This policy explains what personal data Pet Carrier collects, how we use it, and the
        choices you have. We take your privacy seriously and only collect what we need to run our
        store and serve you well.
      </p>

      <h2>Who we are</h2>
      <p>
        Pet Carrier (pet-carrier.co.uk) is a UK-based online store selling pet carriers. For any
        privacy questions, contact hello@pet-carrier.co.uk.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Contact details you provide, such as your name, email address and postal address</li>
        <li>Order details, including items purchased and delivery information</li>
        <li>Account details if you create an account, such as your email and encrypted password</li>
        <li>Payment information, processed securely by Stripe, we never see or store your full card details</li>
        <li>Basic website usage data, such as pages visited, to help us improve the site</li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To process and deliver your orders</li>
        <li>To send order confirmations and updates</li>
        <li>To respond to your enquiries</li>
        <li>To send marketing emails, only if you’ve opted in, and you can unsubscribe at any time</li>
        <li>To improve our website and product range</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We share data with trusted service providers who help us run our store: Stripe for payment
        processing, Resend for transactional emails, and our hosting provider. We do not sell your
        personal data.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR, you have the right to access, correct, or request deletion of your personal
        data, and to object to certain processing. To exercise these rights, email
        hello@pet-carrier.co.uk.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies to keep your basket working and, with your consent, analytics
        cookies to understand how our site is used.
      </p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. Any changes will be posted on this page.</p>
    </LegalPage>
  );
}
