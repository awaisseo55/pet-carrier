import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Pet Carrier team, we usually reply within one working day.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">Get in Touch</h1>
        <p className="mt-2 text-gray-500">Questions about an order, a product, or anything else? We’re happy to help.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-500">hello@pet-carrier.co.uk</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium">Based in</p>
              <p className="text-sm text-gray-500">United Kingdom</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium">Response time</p>
              <p className="text-sm text-gray-500">We usually reply within one working day.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
