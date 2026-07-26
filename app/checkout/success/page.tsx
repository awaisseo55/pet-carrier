"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  React.useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-light">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <h1 className="mt-6 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Thank you, your order is confirmed
      </h1>
      <p className="mt-3 text-gray-500">
        We’ve sent a confirmation email with your order details. We’re getting things ready to
        dispatch from the UK.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="primary" asChild>
          <Link href="/carriers">Continue Shopping</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/account">View My Orders</Link>
        </Button>
      </div>
    </div>
  );
}
