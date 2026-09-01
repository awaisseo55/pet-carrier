import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/track-order/track-order-form";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Pet Carrier order. Enter your order number and email address to see its current status and courier tracking details.",
};

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">Track Your Order</h1>
        <p className="mt-2 text-gray-500">
          Enter your order number and the email address you used at checkout to see its status.
        </p>
      </div>

      <div className="mt-10">
        <TrackOrderForm />
      </div>
    </div>
  );
}
