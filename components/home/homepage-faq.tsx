import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HOMEPAGE_FAQS } from "@/lib/homepage-faqs";

export { HOMEPAGE_FAQS };

export function HomepageFaq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-center font-heading text-3xl font-semibold text-ink sm:text-4xl">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="mt-8">
        {HOMEPAGE_FAQS.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
