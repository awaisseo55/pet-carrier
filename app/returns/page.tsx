import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Returns Policy",
  description: "Our 14-day returns policy for Pet Carrier orders.",
};

const faqs = [
  {
    question: "How long do I have to return an item?",
    answer:
      "You have 14 days from the date your order is delivered to let us know you'd like to return it, and a further 14 days to send it back to us once you have.",
  },
  {
    question: "Does the item need to be unused?",
    answer:
      "Yes. Returned items must be unused, unwashed and in their original packaging with all parts and tags included, so we're able to resell them. We can't offer a refund on anything that shows signs of use.",
  },
  {
    question: "Who pays for return postage?",
    answer:
      "For a change-of-mind return, you're responsible for the cost of sending the item back to us. If your item arrived faulty or damaged, we cover the return postage instead.",
  },
  {
    question: "How do I get my refund?",
    answer:
      "Once we've received and checked your return, we refund the item price to your original payment method. Original delivery charges aren't refunded unless the item was faulty. Refunds usually take 5 to 10 working days to appear, depending on your bank.",
  },
  {
    question: "What if my item arrives faulty or damaged?",
    answer:
      "Contact us as soon as possible with photos where you can. We'll arrange a replacement or a full refund, including the cost of returning it, at no charge to you.",
  },
  {
    question: "Can I exchange an item instead of returning it?",
    answer:
      "We don't offer direct exchanges. Return the original item for a refund and place a new order for the size, colour or product you'd prefer.",
  },
];

export default function ReturnsPage() {
  const faqSchema = faqJsonLd(faqs);

  return (
    <LegalPage title="Returns Policy" updated="3 September 2026">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <p>
        We want you and your pet to be happy with your purchase. If something isn’t right, we’re
        glad to help.
      </p>

      <h2>14-day returns</h2>
      <p>
        You can return most items within 14 days of delivery for a refund, provided they’re unused,
        unwashed, in their original packaging and in a resaleable condition. We’re unable to accept
        a return once an item shows signs of use.
      </p>

      <h2>Who pays for return postage</h2>
      <p>
        If you’ve simply changed your mind, you’re responsible for the cost of returning the item to
        us. If your item arrived faulty or damaged, we cover the return postage instead, see “Faulty
        or damaged items” below.
      </p>

      <h2>How to start a return</h2>
      <p>
        Email us at hello@pet-carrier.co.uk with your order number and the reason for your return.
        We’ll confirm the next steps and provide a returns address.
      </p>

      <h2>Refunds</h2>
      <p>
        Once we’ve received and checked your returned item, we’ll refund the item price to your
        original payment method. Original delivery charges aren’t refunded unless the item was
        faulty. This usually takes 5 to 10 working days to appear, depending on your bank.
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

      <h2>Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LegalPage>
  );
}
