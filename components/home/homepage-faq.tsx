import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const HOMEPAGE_FAQS = [
  {
    question: "What is a pet carrier used for?",
    answer:
      "A pet carrier holds your pet securely and comfortably while you're moving them, whether that's a short trip to the vet, a flight, or every day out and about. A well-designed carrier keeps your pet contained and settled, with enough ventilation and room to sit or turn around comfortably.",
  },
  {
    question: "What's the difference between a pet carrier and a pet stroller?",
    answer:
      "A carrier is worn or carried by hand and suits shorter trips or pets who prefer to be held close, like a shoulder sling or a crate for the car. A stroller is wheeled and better suited to longer walks, older pets, or multi-pet households, letting your pet enjoy being outdoors without being carried the whole way.",
  },
  {
    question: "Do you sell carriers for small pets, or just cats and dogs?",
    answer:
      "Alongside our dog and cat carrier ranges, we stock small animal carriers built for rabbits, guinea pigs, ferrets and other small pets, with solid, ventilated bases rather than the open mesh floor a cat or dog carrier might use.",
  },
  {
    question: "Are your pet carriers suitable for air travel?",
    answer:
      "Some are. Our airline approved pet carriers range groups carriers that meet common cabin size requirements, though airline rules vary, so it's always worth checking your specific airline's pet policy before you fly.",
  },
  {
    question: "How much does delivery cost, and how long does it take?",
    answer:
      "UK delivery is free on orders over £70, with a flat delivery fee shown at checkout below that. Most orders are dispatched within 1 to 3 working days and arrive within 2 to 5 working days after that.",
  },
  {
    question: "What if the carrier, stroller or bed isn't right for my pet?",
    answer:
      "You can return most unused items within 14 days of delivery for a refund, in their original packaging. See our returns policy for full details, including who covers return postage.",
  },
];

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
