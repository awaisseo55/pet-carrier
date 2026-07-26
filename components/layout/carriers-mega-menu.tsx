"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const byPet = [
  { href: "/carriers/dog-carriers", label: "Dog Carriers" },
  { href: "/carriers/cat-carriers", label: "Cat Carriers" },
  { href: "/carriers/small-animal-carriers", label: "Small Animal Carriers" },
  { href: "/carriers/bird-carriers", label: "Bird Carriers" },
];

const byStyle = [
  { href: "/carriers/airline-approved-carriers", label: "Airline Approved" },
  { href: "/carriers/backpack-carriers", label: "Backpack Carriers" },
  { href: "/carriers/rolling-carriers", label: "Rolling Carriers" },
  { href: "/carriers/sling-carriers", label: "Sling Carriers" },
  { href: "/carriers/hard-sided-carriers", label: "Hard-Sided Carriers" },
  { href: "/carriers/soft-sided-carriers", label: "Soft-Sided Carriers" },
];

const byUse = [
  { href: "/carriers/vet-visit-carriers", label: "Vet Visit Carriers" },
  { href: "/carriers/car-travel-carriers", label: "Car Travel Carriers" },
  { href: "/carriers/hiking-pet-carriers", label: "Hiking Carriers" },
  { href: "/carriers/everyday-carriers", label: "Everyday Carriers" },
];

export function CarriersMegaMenu() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const active = pathname.startsWith("/carriers");

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/carriers"
        className={cn(
          "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-ink transition-colors hover:text-emerald-700",
          active && "text-emerald-700"
        )}
      >
        CARRIERS
        <ChevronDown className="size-3.5" />
      </Link>

      {open && (
        <div className="absolute top-full left-1/2 z-40 w-[560px] -translate-x-1/2 pt-2">
          <div className="grid grid-cols-3 gap-6 rounded-lg border border-border bg-white p-6 shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">By Pet</p>
              <ul className="mt-3 flex flex-col gap-2">
                {byPet.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-ink hover:text-emerald-700">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/carriers" className="text-sm font-medium text-emerald-700 hover:underline">
                    View All Carriers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">By Style</p>
              <ul className="mt-3 flex flex-col gap-2">
                {byStyle.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-ink hover:text-emerald-700">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">By Use</p>
              <ul className="mt-3 flex flex-col gap-2">
                {byUse.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-ink hover:text-emerald-700">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
