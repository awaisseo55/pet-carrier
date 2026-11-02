import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getActiveProducts } from "@/lib/products";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/**
 * Full-width forest band carrying four real, checkable facts. Deliberately
 * typographic with no photograph and no icons: it is the one dark moment on
 * an otherwise cream page, and every other section already leans on imagery.
 */
export async function WhyChooseUs() {
  const products = await getActiveProducts();
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];

  const facts = [
    {
      stat: `${products.length} carriers`,
      label: "Every one chosen by hand",
      detail: "A carrier specialist, not a general pet shop. No food, no toys, no padding.",
    },
    {
      stat: `${brands.length} brands`,
      label: "Compared side by side",
      detail: `Including ${brands.slice(0, 3).join(", ")} and more, so you are not stuck with one maker's sizing.`,
    },
    {
      // Hardcoded rather than parsed out of settings.contact_address: the
      // address is a free-text field, so splitting it on commas picked the
      // wrong segment the moment the stored format differed from the local one.
      stat: "Preston",
      label: "Where your parcel ships from",
      detail: "A UK limited company, with a real address on our contact page.",
    },
    {
      stat: "14 days",
      label: "To change your mind",
      detail: "Send it back unused within 14 days for a straightforward refund.",
    },
  ];

  return (
    <section className="bg-forest-800 py-16 text-white lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal direction="up">
          <div className="max-w-2xl">
            <h2 className="text-3xl leading-[1.1] text-white sm:text-4xl">One category, done properly</h2>
            <span className="mt-5 block h-[3px] w-16 rounded-full bg-ember-400" />
            <p className="mt-5 leading-relaxed text-forest-100/70">
              Most pet shops treat carriers as an afterthought beside the food and the toys. Carriers
              are the only thing we sell, which means we can group them by the animal and the journey
              instead of dropping everything into one long list.
            </p>
          </div>
        </Reveal>

        <StaggerGroup className="mt-12 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <StaggerItem key={fact.label}>
              <div className="border-t border-white/15 pt-5">
                <p className="text-2xl text-white">{fact.stat}</p>
                <p className="mt-1.5 text-sm font-bold text-ember-300">{fact.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-forest-100/60">{fact.detail}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal direction="up" delay={0.1}>
          <Link
            href="/about"
            className="mt-12 inline-flex items-center gap-1 rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10"
          >
            More about who we are
            <ChevronRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
