"use client";

import * as React from "react";
import { CheckCircle2, Circle, Package, PackageX, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

interface PublicOrderTracking {
  id: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  items: { title: string; quantity: number; image: string }[];
  total: number;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
}

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "paid", label: "Order placed" },
  { status: "ordered_from_amazon", label: "Processing" },
  { status: "dispatched", label: "Dispatched" },
  { status: "delivered", label: "Delivered" },
];

/** pending_payment orders shouldn't normally be searched (checkout isn't finished yet) but map sensibly if one is. */
function stepIndexForStatus(status: OrderStatus): number {
  if (status === "pending_payment") return -1;
  if (status === "cancelled") return -1;
  const index = STEPS.findIndex((s) => s.status === status);
  return index === -1 ? 0 : index;
}

function courierButtonLabel(courierName: string | undefined): string {
  const name = (courierName || "").toLowerCase();
  if (name.includes("royal mail")) return "Track with Royal Mail";
  if (name.includes("dpd")) return "Track with DPD";
  return "Track parcel";
}

export function TrackOrderForm() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<PublicOrderTracking | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: formData.get("orderId"),
          email: formData.get("email"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong looking up your order. Please try again.");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Something went wrong looking up your order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orderId">Order number</Label>
          <Input id="orderId" name="orderId" required placeholder="e.g. Vx8pQ2rT9k" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <Button type="submit" variant="default" size="lg" disabled={loading}>
          {loading ? "Looking up your order..." : "Track Order"}
        </Button>
        {error && <p className="text-sm text-alert">{error}</p>}
      </form>

      {order && <TrackingResult order={order} />}
    </div>
  );
}

function TrackingResult({ order }: { order: PublicOrderTracking }) {
  const stepIndex = stepIndexForStatus(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">Order #{order.id}</p>
          <p className="text-sm text-gray-500">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <p className="text-sm text-gray-500">{formatPrice(order.total)}</p>
      </div>

      {isCancelled ? (
        <div className="mt-6 flex items-center gap-2 rounded-md bg-alert-light px-4 py-3 text-sm text-alert">
          <PackageX className="size-4 shrink-0" />
          This order has been cancelled.
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
          {STEPS.map((step, i) => {
            const reached = i <= stepIndex;
            return (
              <React.Fragment key={step.status}>
                <li className="flex items-center gap-2 sm:flex-col sm:items-center sm:text-center">
                  {reached ? (
                    <CheckCircle2 className="size-5 shrink-0 text-blue-600" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-gray-300" />
                  )}
                  <span className={reached ? "text-sm font-medium text-foreground" : "text-sm text-gray-400"}>
                    {step.label}
                  </span>
                </li>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 sm:h-0.5 ${i < stepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      )}

      {(order.courier_name || order.tracking_number) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Truck className="size-4 shrink-0 text-blue-700" />
            <span>
              {order.courier_name || "Courier"}
              {order.tracking_number ? ` · ${order.tracking_number}` : ""}
            </span>
          </div>
          {order.tracking_url && (
            <Button asChild variant="outline" size="sm">
              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                {courierButtonLabel(order.courier_name)}
              </a>
            </Button>
          )}
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <Package className="size-4 shrink-0 text-gray-400" />
            <span className="text-foreground">{item.title}</span>
            <span className="text-gray-500">&times;{item.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
