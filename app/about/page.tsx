import Image from "next/image";
import type { Metadata } from "next";
import { Heart, MapPin, PackageCheck } from "lucide-react";
import { LIFESTYLE_IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Pet Carrier is a small, UK-based team curating comfortable, well-made carriers for dogs, cats, small animals and birds.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">Our Story</h1>
        <p className="mt-3 text-gray-500">
          A small, UK-based team on a simple mission: help pets travel a little more comfortably.
        </p>
      </div>

      <div className="relative mt-10 aspect-16/9 overflow-hidden rounded-xl shadow-sm">
        <Image src={LIFESTYLE_IMAGES.about} alt="A contented cat resting in a soft carrier" fill sizes="900px" className="object-cover" />
      </div>

      <div className="mt-10 flex flex-col gap-5 text-gray-500">
        <p>
          Pet Carrier started with a familiar problem: too many carriers on the market look nice in
          photos but fall apart, wobble, or simply were not designed with real pets in mind. We
          wanted somewhere UK pet owners could find carriers that had actually been thought through,
          without wading through endless listings to work out which ones were any good.
        </p>
        <p>
          We are a small team, run from the UK, and every carrier in our range is chosen by hand. We
          look at the materials, the ventilation, how secure the closures are and whether the size
          guidance is honest, not just whether it photographs well. If we would not use it for our
          own pets, we do not sell it.
        </p>
        <p>
          Orders are packed and dispatched here in the UK, so you are buying from a business you can
          actually reach, not a faceless overseas seller. We are still growing, and we read every
          message that comes through our contact page.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Heart className="size-6" />
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold">Handpicked</h3>
          <p className="mt-1 text-sm text-gray-500">Every product is chosen for genuine comfort and quality.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <MapPin className="size-6" />
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold">UK Based</h3>
          <p className="mt-1 text-sm text-gray-500">Packed and dispatched from right here in the UK.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <PackageCheck className="size-6" />
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold">Reliable</h3>
          <p className="mt-1 text-sm text-gray-500">Straightforward ordering, honest tracking, real support.</p>
        </div>
      </div>
    </div>
  );
}
