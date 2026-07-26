"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, ShieldCheck, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82c-.94-.87-1.5-2.06-1.5-3.32h-3.19v13.5c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1 0-5.8c.28 0 .55.04.8.11V9.98a6.1 6.1 0 0 0-.8-.06 6.13 6.13 0 1 0 6.13 6.13V9.36a7.6 7.6 0 0 0 4.46 1.43V7.6a4.7 4.7 0 0 1-2.99-1.78z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5h1.65V3.7C15.9 3.6 15 3.5 13.9 3.5c-2.3 0-3.9 1.4-3.9 4v2.4H7.3V13H10v8h3.5z" />
    </svg>
  );
}

const shopByPet = [
  { href: "/shop/dogs", label: "Dogs" },
  { href: "/shop/cats", label: "Cats" },
  { href: "/shop/small-animals", label: "Small Animals" },
  { href: "/shop/birds", label: "Birds" },
];

const customerService = [
  { href: "/contact", label: "Contact Us" },
  { href: "/shipping", label: "Shipping Info" },
  { href: "/returns", label: "Returns Policy" },
  { href: "/account", label: "My Account" },
];

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function Footer() {
  function handleNewsletter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Thanks for signing up! Keep an eye on your inbox for pet care tips and your 10% code.");
    e.currentTarget.reset();
  }

  return (
    <footer className="bg-sage-800 text-sage-50">
      <div className="bg-sage-700">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h3 className="font-serif text-2xl font-semibold">Get pet care tips and 10% off</h3>
              <p className="mt-1 text-sage-100">
                Join our list for care guides and first look at new arrivals.
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full max-w-md gap-2">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                className="bg-cream text-foreground border-transparent"
              />
              <Button type="submit" variant="default" size="default">
                Sign up
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div>
            <h4 className="font-serif text-lg font-semibold">Pet Carrier</h4>
            <p className="mt-3 text-sm text-sage-100">
              Comfortable, handpicked carriers for dogs, cats, small animals and birds. Proudly UK
              based.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/petcarrieruk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex size-9 items-center justify-center rounded-full bg-sage-600/60 hover:bg-sage-600"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href="https://www.facebook.com/petcarrieruk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex size-9 items-center justify-center rounded-full bg-sage-600/60 hover:bg-sage-600"
              >
                <FacebookIcon className="size-4" />
              </a>
              <a
                href="https://www.tiktok.com/@petcarrieruk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex size-9 items-center justify-center rounded-full bg-sage-600/60 hover:bg-sage-600"
              >
                <TikTokIcon className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sage-100">Shop by Pet</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {shopByPet.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sage-100">Customer Service</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {customerService.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sage-100">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-sage-600/50 pt-8 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-sage-100">
            <MapPin className="size-4 shrink-0" />
            UK based
          </div>
          <div className="flex items-center gap-2 text-sm text-sage-100">
            <ShieldCheck className="size-4 shrink-0" />
            Secure checkout
          </div>
          <div className="flex items-center gap-2 text-sm text-sage-100">
            <Truck className="size-4 shrink-0" />
            Fast dispatch
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-sage-600/50 pt-6 text-xs text-sage-200 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} Pet Carrier. All rights reserved.</p>
          <p>pet-carrier.co.uk</p>
        </div>
      </div>
    </footer>
  );
}
