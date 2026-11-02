import Link from "next/link";
import { Ruler, Route, PlaneTakeoff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/**
 * Buying guidance, placed on the homepage because "which carrier do I actually
 * need" is the question most visitors arrive with. Doubles as genuine internal
 * linking: every anchor below carries the destination category's own keyword,
 * per CLAUDE.md's internal linking rules.
 */
const steps = [
  {
    icon: Ruler,
    title: "Measure before you choose a size",
    body: (
      <>
        Measure your pet from nose to tail base and from floor to shoulder, then add a few
        centimetres so they can stand and turn around. Sizing is the most common reason a carrier
        gets sent back, which is why our{" "}
        <Link href="/carriers/dog-carriers/small-dog-carriers" className="font-semibold text-forest-700 decoration-forest-300 underline underline-offset-4 transition-colors hover:text-ember-600 hover:decoration-ember-400">
          small dogs
        </Link>{" "}
        and{" "}
        <Link href="/carriers/dog-carriers/large-dog-carriers" className="font-semibold text-forest-700 decoration-forest-300 underline underline-offset-4 transition-colors hover:text-ember-600 hover:decoration-ember-400">
          large dogs
        </Link>{" "}
        sections are split by build rather than by breed name.
      </>
    ),
  },
  {
    icon: Route,
    title: "Match the carrier to the journey",
    body: (
      <>
        Short trips and long ones suit different designs. A{" "}
        <Link href="/carriers/dog-carriers/dog-slings" className="font-semibold text-forest-700 decoration-forest-300 underline underline-offset-4 transition-colors hover:text-ember-600 hover:decoration-ember-400">
          dog sling
        </Link>{" "}
        keeps a small pet held close on foot, a crate built for{" "}
        <Link href="/carriers/pet-car-travel-carriers" className="font-semibold text-forest-700 decoration-forest-300 underline underline-offset-4 transition-colors hover:text-ember-600 hover:decoration-ember-400">
          car travel
        </Link>{" "}
        stays put when you brake, and a{" "}
        <Link href="/carriers/pet-carriers-for-vet-visits" className="font-semibold text-forest-700 decoration-forest-300 underline underline-offset-4 transition-colors hover:text-ember-600 hover:decoration-ember-400">
          vet visit pet carrier
        </Link>{" "}
        is usually the one that opens from the top.
      </>
    ),
  },
  {
    icon: PlaneTakeoff,
    title: "Check the rules if you are flying",
    body: (
      <>
        Cabin carrier limits differ between airlines, so confirm the maximum dimensions with yours
        before you buy. Our{" "}
        <Link
          href="/carriers/pet-airline-approved-carriers"
          className="font-semibold text-forest-700 decoration-forest-300 underline underline-offset-4 transition-colors hover:text-ember-600 hover:decoration-ember-400"
        >
          airline approved pet carrier
        </Link>{" "}
        range lists the measurements for every model so you can check them against your airline.
      </>
    ),
  },
];

export function ChoosingGuide() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-4">
          <Reveal direction="up" className="lg:sticky lg:top-28">
            <span className="font-sans text-[0.7rem] font-bold tracking-[0.16em] text-ember-600 uppercase">
              Buying guide
            </span>
            <h2 className="mt-2.5 text-3xl leading-[1.1] text-ink sm:text-4xl lg:text-[2.75rem]">
              How to choose the right pet carrier
            </h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              Three things worth getting right before you buy, from the questions customers ask us
              most often.
            </p>
            <Button variant="outline" size="lg" className="mt-7" asChild>
              <Link href="/blog">Read our travel guides</Link>
            </Button>
          </Reveal>
        </div>

        <div className="lg:col-span-8">
          <StaggerGroup className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <StaggerItem key={step.title}>
                <div className="group flex gap-5 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-forest-200 hover:shadow-lg sm:gap-6 sm:p-7">
                  <div className="flex shrink-0 flex-col items-center gap-2.5">
                    <span className="flex size-12 items-center justify-center rounded-full bg-forest-100 text-forest-700 transition-all duration-300 group-hover:bg-forest-700 group-hover:text-white">
                      <step.icon className="size-5" />
                    </span>
                    <span className="font-sans text-xs font-bold tracking-widest text-gray-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl text-ink">{step.title}</h3>
                    <p className="mt-2.5 leading-relaxed text-gray-600">{step.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
