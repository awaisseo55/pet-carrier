import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqJsonLd } from "@/lib/seo";
import type { BlogFaq } from "@/lib/types";

export function ArticleFaq({ faqs }: { faqs: BlogFaq[] }) {
  if (faqs.length === 0) return null;

  return (
    <div id="faqs">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      <h2 className="font-heading text-2xl font-semibold text-foreground scroll-mt-24">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="mt-3">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
