import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HOMEPAGE_FAQS } from "@/lib/homepage-faqs";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/motion/reveal";

export { HOMEPAGE_FAQS };

export async function HomepageFaq() {
  const settings = await getSettings();

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <Reveal direction="up" className="lg:col-span-4">
          <span className="font-sans text-[0.7rem] font-bold tracking-[0.16em] text-ember-600 uppercase">
            Questions
          </span>
          <h2 className="mt-2.5 text-3xl leading-[1.1] text-ink sm:text-4xl lg:text-[2.75rem]">
            Frequently asked questions
          </h2>
          <p className="mt-4 leading-relaxed text-gray-600">
            Delivery, returns and sizing, answered. If yours is not here, ask us directly and a real
            person will reply.
          </p>

          <div className="mt-7 rounded-2xl border border-forest-200 bg-forest-50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <MessageCircle className="size-4 text-forest-600" />
              Still need a hand?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Use the chat button in the corner of any page, or email us and we will come back to you.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link
                href="/contact"
                className="font-semibold text-forest-700 underline-offset-4 hover:underline"
              >
                Contact us
              </Link>
              <a
                href={`mailto:${settings.contact_email}`}
                className="flex items-center gap-1.5 text-gray-600 hover:text-forest-700"
              >
                <Mail className="size-3.5" />
                {settings.contact_email}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.12} className="lg:col-span-8">
          <Accordion type="single" collapsible>
            {HOMEPAGE_FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
