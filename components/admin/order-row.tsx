"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, CreditCard, ExternalLink, Truck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "ordered_from_amazon", label: "Ordered from Amazon" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

async function patchOrder(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Could not update this order.");
  }
}

export function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [updating, setUpdating] = React.useState(false);
  const [courierName, setCourierName] = React.useState(order.courier_name ?? "");
  const [trackingNumber, setTrackingNumber] = React.useState(order.tracking_number ?? "");
  const [trackingUrl, setTrackingUrl] = React.useState(order.tracking_url ?? "");
  const [trackingDirty, setTrackingDirty] = React.useState(false);

  const isCod = order.payment_method === "cash_on_delivery";

  async function handleStatusChange(status: string) {
    setUpdating(true);
    try {
      await patchOrder(order.id, { status });
      toast.success("Order status updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order status");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveTracking() {
    setUpdating(true);
    try {
      await patchOrder(order.id, {
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      });
      toast.success("Tracking details saved");
      setTrackingDirty(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save tracking details");
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkCodPaid() {
    setUpdating(true);
    try {
      // Payment status only, this never calls Stripe, it just records that
      // the courier collected payment on delivery.
      await patchOrder(order.id, { payment_status: "paid" });
      toast.success("Marked as paid");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update payment status");
    } finally {
      setUpdating(false);
    }
  }

  function copyReorderLinks() {
    const links = order.items.map((item) => item.amazon_url).filter(Boolean).join("\n");
    if (!links) {
      toast.error("No Amazon links found for this order.");
      return;
    }
    navigator.clipboard.writeText(links);
    toast.success("Amazon URLs copied to clipboard");
  }

  return (
    <tr className={`border-b border-border last:border-0 align-top hover:bg-gray-100/30 ${isCod ? "bg-blue-50/30" : ""}`}>
      <td className="p-3 font-medium">#{order.id}</td>
      <td className="p-3">
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
        {order.customer_phone && <p className="text-xs text-muted-foreground">{order.customer_phone}</p>}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isCod ? <Truck className="size-3.5 text-blue-700" /> : <CreditCard className="size-3.5 text-gray-500" />}
          {isCod ? "Cash on delivery" : "Card"}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isCod ? "Due on delivery: " : "Payment: "}
          <span className="font-medium text-ink">
            {isCod ? formatPrice(order.total) : order.payment_status}
          </span>
        </p>
        {isCod && order.payment_status !== "paid" && (
          <Button size="sm" variant="outline" className="mt-1.5 h-7 px-2 text-xs" onClick={handleMarkCodPaid} disabled={updating}>
            Mark as paid
          </Button>
        )}
        {isCod && order.payment_status === "paid" && (
          <p className="mt-1 text-xs font-medium text-success">Collected on delivery</p>
        )}
      </td>
      <td className="p-3">
        <ul className="flex flex-col gap-1">
          {order.items.map((item) => (
            <li key={`${item.product_id}-${item.variant_sku ?? ""}`} className="text-xs">
              <p>
                {item.quantity} &times; {item.title}
              </p>
              {item.variant_label && <p className="text-muted-foreground">{item.variant_label}</p>}
              {item.amazon_url ? (
                <a
                  href={item.amazon_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-blue-700 hover:underline"
                >
                  <ExternalLink className="size-3" />
                  Amazon source link
                </a>
              ) : (
                <span className="mt-0.5 inline-block text-muted-foreground">No Amazon source link on record</span>
              )}
            </li>
          ))}
        </ul>
      </td>
      <td className="p-3">{formatPrice(order.total)}</td>
      <td className="p-3">
        {new Date(order.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="p-3">
        <Select value={order.status} onValueChange={handleStatusChange} disabled={updating}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-2 flex flex-col gap-1.5">
          <Input
            value={courierName}
            onChange={(e) => {
              setCourierName(e.target.value);
              setTrackingDirty(true);
            }}
            placeholder="Courier name"
            className="h-8 w-44 text-xs"
          />
          <Input
            value={trackingNumber}
            onChange={(e) => {
              setTrackingNumber(e.target.value);
              setTrackingDirty(true);
            }}
            placeholder="Tracking number"
            className="h-8 w-44 text-xs"
          />
          <Input
            value={trackingUrl}
            onChange={(e) => {
              setTrackingUrl(e.target.value);
              setTrackingDirty(true);
            }}
            placeholder="Tracking URL"
            className="h-8 w-44 text-xs"
          />
          {trackingDirty && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={handleSaveTracking} disabled={updating}>
              Save tracking
            </Button>
          )}
        </div>
        {(order.dispatch_email_sent_at || order.delivered_email_sent_at || order.cancellation_email_sent_at) && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {order.dispatch_email_sent_at && "Dispatch email sent"}
            {order.delivered_email_sent_at && " · Delivered email sent"}
            {order.cancellation_email_sent_at && " · Cancellation email sent"}
          </p>
        )}
      </td>
      <td className="p-3">
        <Button size="sm" variant="outline" onClick={copyReorderLinks}>
          <Copy className="size-3.5" />
          Copy Amazon URLs
        </Button>
      </td>
    </tr>
  );
}
