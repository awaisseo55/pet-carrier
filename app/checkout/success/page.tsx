"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <Loader2 className="mx-auto size-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </React.Suspense>
  );
}

interface CodSummary {
  orderId: string;
  total: number;
  itemCount: number;
  customerFirstName?: string;
}

const MAX_VERIFY_ATTEMPTS = 8;
const VERIFY_INTERVAL_MS = 1500;

function CheckoutSuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isCod = searchParams.get("cod") === "1";

  const [status, setStatus] = React.useState<"checking" | "confirmed" | "timeout" | "generic">(
    sessionId ? "checking" : isCod ? "checking" : "generic"
  );
  const [codSummary, setCodSummary] = React.useState<CodSummary | null>(null);

  // Cash on delivery: the order was already created server-side before the
  // browser was redirected here, so this just reads back the summary the
  // API returned and clears the cart. No order lookup by ID involved.
  React.useEffect(() => {
    if (!isCod) return;
    const raw = sessionStorage.getItem("cod_order_summary");
    sessionStorage.removeItem("cod_order_summary");
    // Deferred via a microtask so state updates happen in a callback rather
    // than synchronously in the effect body (react-hooks/set-state-in-effect).
    if (raw) {
      queueMicrotask(() => {
        try {
          setCodSummary(JSON.parse(raw));
          setStatus("confirmed");
          clearCart();
        } catch {
          setStatus("generic");
        }
      });
    } else {
      queueMicrotask(() => setStatus("generic"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCod]);

  // Card payment: poll a boolean-only endpoint until the webhook has
  // recorded the order, only then clear the cart. A refresh or a webhook
  // that hasn't landed yet must never wipe a basket for nothing.
  React.useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/checkout/session/verify?session_id=${encodeURIComponent(sessionId!)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) {
          setStatus("confirmed");
          clearCart();
          return;
        }
      } catch {
        // transient network error, fall through to retry below
      }
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        if (!cancelled) setStatus("timeout");
        return;
      }
      setTimeout(poll, VERIFY_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (status === "checking") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-50">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Confirming your order...
        </h1>
        <p className="mt-3 text-gray-500">This only takes a moment.</p>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Your payment is still being confirmed
        </h1>
        <p className="mt-3 text-gray-500">
          This is taking longer than usual. We’ll email your order confirmation as soon as it’s ready, please
          check your inbox shortly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="primary" asChild>
            <Link href="/carriers">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const heading = isCod ? "Your order has been received" : "Thank you, your order is confirmed";
  const description = isCod
    ? "No online payment was taken. Please have an accepted payment method ready when your parcel arrives."
    : "We’ve sent a confirmation email with your order details. We’re getting things ready to dispatch from the UK.";

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-light">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <h1 className="mt-6 font-heading text-3xl font-semibold text-foreground sm:text-4xl">{heading}</h1>
      <p className="mt-3 text-gray-500">{description}</p>

      {isCod && codSummary && (
        <div className="mx-auto mt-6 max-w-xs rounded-lg border border-border bg-card p-5 text-left shadow-sm">
          <p className="text-xs text-muted-foreground">Order reference</p>
          <p className="font-medium text-ink">#{codSummary.orderId}</p>
          <p className="mt-3 text-xs text-muted-foreground">Amount due on delivery</p>
          <p className="font-heading text-xl font-semibold text-ink">{formatPrice(codSummary.total)}</p>
        </div>
      )}

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
