import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardCheck, Mail, MapPin, PackageCheck, Search, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIFESTYLE_IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Pet Carrier is a UK limited company based in Manchester, curating comfortable, well-made carriers, strollers and beds for dogs, cats, small pets and birds.",
};

const process = [
  {
    step: "1",
    icon: Search,
    title: "Start from the animal, not the product",
    description:
      "A rabbit needs a solid, ventilated base rather than a mesh floor. A cat generally settles faster in an enclosed space. We work out what a pet actually needs before we look at what's available to sell.",
  },
  {
    step: "2",
    icon: ClipboardCheck,
    title: "Check the details that matter",
    description:
      "Base rigidity, ventilation, closures, and whether the size guidance given actually matches the real product, not just the star rating or the listing photo.",
  },
  {
    step: "3",
    icon: PackageCheck,
    title: "Bring it under our own brand",
    description:
      "Approved products are repackaged and sold under the Pet Carrier name, so you're dealing with one business for the product, the order and the support, not a marketplace listing.",
  },
  {
    step: "4",
    icon: Truck,
    title: "Pack and dispatch from Manchester",
    description:
      "Every order ships from our UK base with tracking, and a real inbox to contact if something isn't right.",
  },
];

const stats = [
  { icon: MapPin, label: "Based in Manchester, UK" },
  { icon: Truck, label: "Free UK shipping over £70" },
  { icon: Undo2, label: "14-day returns" },
  { icon: ShieldCheck, label: "Secure checkout via Stripe" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">About Pet Carrier</h1>
        <p className="mt-3 text-lg text-gray-500">
          A UK online retailer for pet carriers, strollers and beds, run from Manchester and built
          around getting the right product to the right pet.
        </p>
      </div>

      <div className="relative mt-10 aspect-16/9 overflow-hidden rounded-xl shadow-sm">
        <Image
          src={LIFESTYLE_IMAGES.about}
          alt="A contented cat resting in a soft carrier"
          fill
          sizes="900px"
          className="object-cover"
        />
      </div>

      <div className="mt-10 flex flex-col gap-5 text-gray-600">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Who We Are</h2>
        <p>
          Pet Carrier is a UK registered limited company based in Manchester, specialising in pet
          carriers, strollers and beds for dogs, cats, small pets and birds. Every order is packed
          and dispatched from right here, not routed through an overseas seller you can never
          actually reach.
        </p>
        <p>
          We started because too many pet carriers are designed to look good in a listing photo
          rather than actually work for the animal inside them: bases that flex under a cat’s
          weight, mesh too fine to see through comfortably, size charts that don’t match the real
          product. Our job is to filter that out before it reaches you, not add to it.
        </p>
        <p>
          We’re still a small, growing business, and every message that comes through our{" "}
          <Link href="/contact" className="text-blue-700 hover:underline">
            contact page
          </Link>{" "}
          is read and answered by a real person, usually within one working day.
        </p>
      </div>

      <div className="mt-14">
        <h2 className="text-center font-heading text-2xl font-semibold text-foreground">
          How We Choose What We Sell
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {process.map((item) => (
            <div key={item.step} className="relative rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {item.step}
                </span>
                <item.icon className="size-5 shrink-0 text-blue-700" />
                <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-lg bg-gray-50 p-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="size-6 text-blue-700" />
              <span className="text-sm font-medium text-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
        <Mail className="size-8 text-blue-700" />
        <h2 className="font-heading text-xl font-semibold text-foreground">Questions Before You Order?</h2>
        <p className="max-w-md text-sm text-gray-500">
          Whether it’s sizing advice or a question about a specific pet, get in touch and we’ll help
          you find the right fit.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="default" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/track-order">Track an Order</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
