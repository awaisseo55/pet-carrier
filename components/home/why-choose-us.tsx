import { Shield, Star, Truck } from "lucide-react";

const points = [
  {
    icon: Star,
    title: "Handpicked Quality",
    description:
      "Every product is chosen by hand for comfort, durability and genuinely good design, not just what happens to be trending.",
  },
  {
    icon: Truck,
    title: "UK-Based Fulfilment",
    description:
      "We repackage and dispatch every order right here in the UK, so you are never left guessing where your parcel really is.",
  },
  {
    icon: Shield,
    title: "30-Day Returns",
    description: "Not quite right? Send it back within 30 days for a straightforward refund, no fuss.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Why Pet Carrier</h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {points.map((point) => (
          <div key={point.title} className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <point.icon className="size-7" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-ink">{point.title}</h3>
            <p className="mt-2 text-gray-500">{point.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
