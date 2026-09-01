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

const shopLinks = [
  { href: "/carriers", label: "Carriers" },
  { href: "/strollers", label: "Strollers" },
  { href: "/beds", label: "Beds" },
  { href: "/carriers", label: "Sale" },
];

const supportLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/track-order", label: "Track Order" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/contact", label: "FAQ" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "Careers" },
  { href: "/about", label: "Press" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

const paymentMethods = ["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay", "Google Pay"];

export function Footer() {
  function handleNewsletter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Thanks for signing up! Keep an eye on your inbox for pet care tips and your 10% code.");
    e.currentTarget.reset();
  }

  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="border-b border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-white">Get pet care tips and 10% off</h3>
              <p className="mt-1 text-gray-400">Join our list for care guides and first look at new arrivals.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full max-w-md gap-2">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                className="bg-white text-ink border-transparent"
              />
              <Button type="submit" variant="default" size="default">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Shop</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {shopLinks.map((link, i) => (
                <li key={link.label + i}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Support</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {supportLinks.map((link, i) => (
                <li key={link.label + i}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Company</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {companyLinks.map((link, i) => (
                <li key={link.label + i}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-gray-700 pt-8 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/petcarrieruk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href="https://www.facebook.com/petcarrieruk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex size-9 items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
            >
              <FacebookIcon className="size-4" />
            </a>
            <a
              href="https://www.tiktok.com/@petcarrieruk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex size-9 items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
            >
              <TikTokIcon className="size-4" />
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-gray-700 pt-8 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="size-4 shrink-0" />
            UK based
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ShieldCheck className="size-4 shrink-0" />
            Secure checkout
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Truck className="size-4 shrink-0" />
            Fast dispatch
          </div>
        </div>

      </div>

      <div className="border-t border-gray-700 bg-gray-900">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Pet Carrier. All rights reserved. Made in the UK.</p>
          <p>pet-carrier.co.uk</p>
        </div>
      </div>
    </footer>
  );
}
