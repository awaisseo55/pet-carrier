import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, Mail, MapPin, Package, RotateCcw, Truck } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Pet Carrier team, we usually reply within one working day.",
};

const quickLinks = [
  { href: "/track-order", label: "Track an order", icon: Truck },
  { href: "/shipping", label: "Shipping information", icon: Package },
  { href: "/returns", label: "Returns policy", icon: RotateCcw },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">Get in Touch</h1>
        <p className="mt-2 text-gray-500">Questions about an order, a product, or anything else? We’re happy to help.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">Contact details</h2>
            <div className="mt-5 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-blue-700" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:hello@pet-carrier.co.uk" className="text-sm text-gray-500 hover:text-blue-700">
                    hello@pet-carrier.co.uk
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-blue-700" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-gray-500">10 Stafford Road, Preston, PR1 6LB, United Kingdom</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-blue-700" />
                <div>
                  <p className="font-medium">Response time</p>
                  <p className="text-sm text-gray-500">We usually reply within one working day.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">Common questions</h2>
            <p className="mt-1 text-sm text-gray-500">You might find a quicker answer here.</p>
            <ul className="mt-4 flex flex-col gap-1">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-blue-50 hover:text-blue-700"
                  >
                    <link.icon className="size-4 shrink-0 text-blue-700" />
                    <span className="flex-1">{link.label}</span>
                    <ChevronRight className="size-4 shrink-0 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
