"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Truck,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Card({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
        {Icon && <Icon className="size-4 text-blue-600" />}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

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

function NotificationRow({
  orderId,
  type,
  label,
  sentAt,
  eligible,
  eligibleHint,
  onSent,
}: {
  orderId: string;
  type: "dispatched" | "cancelled" | "delivered";
  label: string;
  sentAt?: string;
  eligible: boolean;
  eligibleHint: string;
  onSent: () => void;
}) {
  const [sending, setSending] = React.useState(false);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not send notification.");
      }
      toast.success(`${label} email sent to customer`);
      onSent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send notification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {sentAt ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-success">
            <Check className="size-3" strokeWidth={3} />
            Sent {formatDate(sentAt)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">{eligible ? "Not sent yet" : eligibleHint}</p>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={handleSend} disabled={sending || !eligible || Boolean(sentAt)}>
        {sending ? "Sending..." : sentAt ? "Sent" : "Send"}
      </Button>
    </div>
  );
}

function RefundCard({ order, onRefunded }: { order: Order; onRefunded: () => void }) {
  const alreadyRefunded = order.refunded_amount || 0;
  const remaining = Math.max(0, Math.round((order.total - alreadyRefunded) * 100) / 100);
  const [amount, setAmount] = React.useState(remaining.toFixed(2));
  const [refunding, setRefunding] = React.useState(false);

  const isCod = order.payment_method === "cash_on_delivery";
  if (isCod || !order.stripe_session_id || order.payment_status === "pending" || order.payment_status === "failed") {
    return null;
  }

  async function handleRefund() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid refund amount.");
      return;
    }
    if (value > remaining + 0.005) {
      toast.error(`You can refund up to ${formatPrice(remaining)}.`);
      return;
    }
    if (!confirm(`Refund ${formatPrice(value)} to the customer's card via Stripe? This cannot be undone.`)) return;

    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not process the refund.");
      }
      toast.success(`Refunded ${formatPrice(value)}`);
      onRefunded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process the refund.");
    } finally {
      setRefunding(false);
    }
  }

  if (remaining <= 0) {
    return (
      <Card title="Refund" icon={RotateCcw}>
        <p className="text-sm font-medium text-success">Fully refunded {formatPrice(alreadyRefunded)}.</p>
        {order.refunds && order.refunds.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            {order.refunds.map((r) => (
              <li key={r.id}>
                {formatPrice(r.amount)} on {formatDate(r.created_at)}
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <Card title="Refund" icon={RotateCcw}>
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        {alreadyRefunded > 0 && (
          <div className="flex justify-between text-alert">
            <span>Already refunded</span>
            <span>-{formatPrice(alreadyRefunded)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-1.5 font-medium text-ink">
          <span>Refundable</span>
          <span>{formatPrice(remaining)}</span>
        </div>
      </div>

      <div className="mt-3">
        <Label htmlFor="refund-amount">Refund amount (£)</Label>
        <Input
          id="refund-amount"
          type="number"
          step="0.01"
          min="0.01"
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5"
        />
      </div>

      <Button
        variant="outline"
        className="mt-3 w-full border-alert/40 text-alert hover:bg-alert-light"
        onClick={handleRefund}
        disabled={refunding}
      >
        {refunding ? "Processing refund..." : `Refund ${formatPrice(Number(amount) || 0)}`}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">Issues a real refund via Stripe to the customer&rsquo;s original payment method.</p>

      {order.refunds && order.refunds.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {order.refunds.map((r) => (
            <li key={r.id}>
              {formatPrice(r.amount)} refunded on {formatDate(r.created_at)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function OrderDetail({ order }: { order: Order }) {
  const router = useRouter();
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [trackingSaving, setTrackingSaving] = React.useState(false);
  const [markingPaid, setMarkingPaid] = React.useState(false);

  const [courierName, setCourierName] = React.useState(order.courier_name ?? "");
  const [trackingNumber, setTrackingNumber] = React.useState(order.tracking_number ?? "");
  const [trackingUrl, setTrackingUrl] = React.useState(order.tracking_url ?? "");
  const trackingSectionRef = React.useRef<HTMLDivElement>(null);

  const isCod = order.payment_method === "cash_on_delivery";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  async function handleStatusChange(newStatus: string) {
    const status = newStatus as OrderStatus;

    if (status === "dispatched" && !courierName.trim() && !trackingNumber.trim()) {
      toast.error("Add a courier and tracking number below before marking this order as dispatched.");
      trackingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setStatusUpdating(true);
    try {
      const body: Record<string, unknown> = { status };
      if (status === "dispatched") {
        body.courier_name = courierName;
        body.tracking_number = trackingNumber;
        body.tracking_url = trackingUrl;
      }
      await patchOrder(order.id, body);
      toast.success("Order status updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order status");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleSaveTracking() {
    setTrackingSaving(true);
    try {
      await patchOrder(order.id, {
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      });
      toast.success("Tracking details saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save tracking details");
    } finally {
      setTrackingSaving(false);
    }
  }

  async function handleMarkCodPaid() {
    setMarkingPaid(true);
    try {
      await patchOrder(order.id, { payment_status: "paid" });
      toast.success("Marked as paid");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update payment status");
    } finally {
      setMarkingPaid(false);
    }
  }

  function copyCustomerDetails() {
    const lines = [
      order.customer_name,
      order.customer_email,
      order.customer_phone || "",
      order.shipping_address.line1,
      order.shipping_address.line2 || "",
      `${order.shipping_address.city}${order.shipping_address.county ? `, ${order.shipping_address.county}` : ""}`,
      order.shipping_address.postcode,
      order.shipping_address.country,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Customer details copied");
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
    <div>
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Customer" icon={User}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2 text-sm">
                <p className="font-medium text-ink">{order.customer_name}</p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  {order.customer_email}
                </p>
                {order.customer_phone && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" />
                    {order.customer_phone}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={copyCustomerDetails} className="shrink-0">
                <Copy className="size-3.5" />
                Copy details
              </Button>
            </div>
          </Card>

          <Card title="Shipping Address" icon={MapPin}>
            <div className="text-sm text-muted-foreground">
              <p className="text-ink">{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {order.shipping_address.city}
                {order.shipping_address.county ? `, ${order.shipping_address.county}` : ""}
              </p>
              <p>{order.shipping_address.postcode}</p>
              <p>{order.shipping_address.country}</p>
              {order.shipping_address.delivery_instructions && (
                <p className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-ink">
                  <span className="font-medium">Delivery instructions:</span>{" "}
                  {order.shipping_address.delivery_instructions}
                </p>
              )}
            </div>
          </Card>

          <Card title="Items" icon={Package}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
              <Button size="sm" variant="outline" onClick={copyReorderLinks}>
                <Copy className="size-3.5" />
                Copy Amazon URLs
              </Button>
            </div>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <li key={`${item.product_id}-${item.variant_sku ?? ""}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {item.quantity} &times; {item.title}
                    </p>
                    {item.variant_label && <p className="text-xs text-muted-foreground">{item.variant_label}</p>}
                    {item.amazon_url ? (
                      <a
                        href={item.amazon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        Amazon source link
                      </a>
                    ) : (
                      <span className="mt-1 inline-block text-xs text-muted-foreground">No Amazon source link on record</span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Order Summary">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Payment">
            <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
              {isCod ? <Truck className="size-4 text-blue-700" /> : <Package className="size-4 text-gray-500" />}
              {isCod ? "Cash on delivery" : "Card via Stripe"}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {isCod ? "Due on delivery" : "Payment status"}:{" "}
              <span className="font-medium text-ink">{isCod ? formatPrice(order.total) : order.payment_status}</span>
            </p>
            {isCod && order.payment_status !== "paid" && (
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={handleMarkCodPaid} disabled={markingPaid}>
                {markingPaid ? "Saving..." : "Mark as paid"}
              </Button>
            )}
            {isCod && order.payment_status === "paid" && (
              <p className="mt-2 text-xs font-medium text-success">Collected on delivery</p>
            )}
          </Card>

          <RefundCard key={order.refunded_amount || 0} order={order} onRefunded={() => router.refresh()} />

          <Card title="Fulfilment Status">
            <Label>Status</Label>
            <Select value={order.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
              <SelectTrigger className="mt-1.5 w-full">
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

            <div ref={trackingSectionRef} className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <Label>Tracking details</Label>
              <Input
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="Courier name (e.g. Royal Mail)"
              />
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking number"
              />
              <Input
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="Tracking URL (optional)"
              />
              <Button size="sm" variant="outline" onClick={handleSaveTracking} disabled={trackingSaving}>
                {trackingSaving ? "Saving..." : "Save tracking details"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Add these before selecting &ldquo;Dispatched&rdquo; above, they&rsquo;re included in the dispatch email.
              </p>
            </div>
          </Card>

          <Card title="Customer Notifications">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-ink">Order confirmation</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.confirmation_email_sent_at ? `Sent automatically ${formatDate(order.confirmation_email_sent_at)}` : "Sent automatically once payment is confirmed"}
                  </p>
                </div>
              </div>
              <NotificationRow
                orderId={order.id}
                type="dispatched"
                label="Dispatch email"
                sentAt={order.dispatch_email_sent_at}
                eligible={order.status === "dispatched"}
                eligibleHint='Available once status is "Dispatched"'
                onSent={() => router.refresh()}
              />
              <NotificationRow
                orderId={order.id}
                type="delivered"
                label="Delivered email"
                sentAt={order.delivered_email_sent_at}
                eligible={order.status === "delivered"}
                eligibleHint='Available once status is "Delivered"'
                onSent={() => router.refresh()}
              />
              <NotificationRow
                orderId={order.id}
                type="cancelled"
                label="Cancellation email"
                sentAt={order.cancellation_email_sent_at}
                eligible={order.status === "cancelled"}
                eligibleHint='Available once status is "Cancelled"'
                onSent={() => router.refresh()}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
