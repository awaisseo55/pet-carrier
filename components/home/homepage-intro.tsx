import Link from "next/link";

const popularCategories = [
  { href: "/carriers/dog-carriers", label: "Dog Carriers" },
  { href: "/carriers/cat-carriers", label: "Cat Carriers" },
  { href: "/carriers/small-animal-carriers", label: "Small Animal Carriers" },
  { href: "/carriers/pet-airline-approved-carriers", label: "Airline Approved Pet Carriers" },
  { href: "/carriers/pet-carriers-for-vet-visits", label: "Vet Visit Carriers" },
];

export function HomepageIntro() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-center font-heading text-3xl font-semibold text-ink sm:text-4xl">
        Carriers, Strollers and Beds for Every Kind of Companion
      </h2>
      <div className="mt-6 flex flex-col gap-4 text-gray-600">
        <p>
          Pet Carrier is a UK shop built around one idea: whatever you’re moving your pet in,
          or settling them into, it should fit the animal, not just the trip. Our range covers dog
          carriers, cat carriers and small animal carriers for pets like rabbits, guinea pigs and
          ferrets, alongside pet strollers for longer walks and pet beds for the rest of the time in
          between.
        </p>
        <p>
          Every pet carrier, stroller and bed on the site is chosen by hand, checked against the
          animal it’s meant for, and dispatched from our base in Preston. Whether you need a
          soft-sided animal carrier for a small dog, a sturdy hard-sided crate for car travel, or a
          carrier built specifically for small pets, our category pages group everything by animal
          and by use, so you can find the right fit without wading through listings that were never
          designed with your pet in mind.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {popularCategories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-50"
          >
            {category.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
