import { Heart, MapPin, Truck } from "lucide-react";

const points = [
  {
    icon: Heart,
    title: "Handpicked Quality",
    description:
      "Every carrier is chosen by hand for comfort, durability and genuinely good design, not just what happens to be trending.",
  },
  {
    icon: MapPin,
    title: "UK-Based Fulfilment",
    description:
      "We repackage and dispatch every order right here in the UK, so you are never left guessing where your parcel really is.",
  },
  {
    icon: Truck,
    title: "Fast Dispatch",
    description:
      "Orders are picked and sent out quickly, with tracked delivery so you always know when your carrier will arrive.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          Why Choose Pet Carrier
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {points.map((point) => (
          <div key={point.title} className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              <point.icon className="size-7" />
            </div>
            <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">{point.title}</h3>
            <p className="mt-2 text-brown-soft">{point.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
