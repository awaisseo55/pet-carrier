"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

export function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [updating, setUpdating] = React.useState(false);

  async function handleStatusChange(status: string) {
    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    if (res.ok) {
      toast.success("Order status updated");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not update order status");
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
    <tr className="border-b border-border last:border-0 align-top hover:bg-gray-100/30">
      <td className="p-3 font-medium">#{order.id}</td>
      <td className="p-3">
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
      </td>
      <td className="p-3">
        <ul className="flex flex-col gap-1">
          {order.items.map((item) => (
            <li key={item.product_id} className="text-xs">
              <p>
                {item.quantity} &times; {item.title}
              </p>
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
          <SelectTrigger className="h-9 w-48">
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
