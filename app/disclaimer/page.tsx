import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important information about product descriptions, sizing and general advice on this site.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="26 July 2026">
      <h2>General information only</h2>
      <p>
        Content on this website, including product descriptions, buying guides and blog posts, is
        provided for general information purposes. It is not a substitute for professional
        veterinary advice. If you have concerns about your pet’s health, wellbeing or behaviour,
        please speak to a qualified vet.
      </p>

      <h2>No health claims</h2>
      <p>
        We describe our carriers in terms of their design, materials and intended comfort, such as
        being “designed for comfort” during travel. We do not make claims that any product
        prevents, treats or cures anxiety, illness or behavioural issues in pets.
      </p>

      <h2>Sizing and fit</h2>
      <p>
        Dimensions and weight guidance are provided as a general guide based on manufacturer
        information. We recommend measuring your pet before ordering. Fit can vary between animals
        of the same breed or weight.
      </p>

      <h2>Product sourcing</h2>
      <p>
        Pet Carrier curates and sells products through a UK-based fulfilment process. We are an
        independent retailer and are not officially affiliated with, endorsed by, or sponsored by
        Amazon or any manufacturer whose products may share similarities with items in our range.
      </p>

      <h2>External links</h2>
      <p>
        Our site may link to third-party websites, including our blog posts. We are not responsible
        for the content or practices of external sites.
      </p>

      <h2>Contact</h2>
      <p>If you have questions about this disclaimer, contact hello@pet-carrier.co.uk.</p>
    </LegalPage>
  );
}
