import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-alert-light">
        <XCircle className="size-8 text-alert" />
      </div>
      <h1 className="mt-6 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Checkout cancelled
      </h1>
      <p className="mt-3 text-gray-500">
        No payment was taken. Your basket is still waiting for you whenever you’re ready.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="primary" asChild>
          <Link href="/cart">Return to Basket</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/carriers">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
