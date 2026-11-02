import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

const popularCategories = [
  { href: "/carriers/dog-carriers", label: "Dog Carriers" },
  { href: "/carriers/cat-carriers", label: "Cat Carriers" },
  { href: "/carriers/small-animal-carriers", label: "Small Animal Carriers" },
  { href: "/carriers/pet-airline-approved-carriers", label: "Airline Approved Pet Carriers" },
  { href: "/carriers/pet-carriers-for-vet-visits", label: "Vet Visit Carriers" },
];

export function HomepageIntro() {
  return (
    <section className="border-t border-border bg-gray-50 py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <Reveal direction="up" className="lg:col-span-4">
          <h2 className="text-3xl leading-[1.1] text-ink sm:text-4xl">
            Pet carriers for every kind of companion
          </h2>
        </Reveal>
        <Reveal direction="up" delay={0.1} className="lg:col-span-8">
          <div className="flex flex-col gap-4 leading-relaxed text-gray-600">
            <p>
              Pet Carrier is a UK shop built around one idea: whatever you’re moving your pet in, it
              should fit the animal, not just the trip. Our range covers dog carriers, cat carriers
              and small animal carriers for pets like rabbits, guinea pigs and ferrets, plus bird
              carriers, each organised by animal, style and use.
            </p>
            <p>
              Every pet carrier on the site is chosen by hand, checked against the animal it’s meant
              for, and dispatched from our base in Preston. Whether you need a soft-sided carrier for
              a small dog, a sturdy hard-sided crate for car travel, or a carrier built specifically
              for small pets, our category pages group everything by animal and by use, so you can
              find the right fit without wading through listings that were never designed with your
              pet in mind.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {popularCategories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="rounded-full border border-border bg-card px-4 py-2 font-sans text-sm font-semibold text-forest-800 transition-all hover:-translate-y-0.5 hover:border-forest-400 hover:bg-forest-50"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
