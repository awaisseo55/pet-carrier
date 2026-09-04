"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, Package, Search, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/types";

/** Orders created before payment_method existed are all Stripe card orders, that was the only payment method available at the time. */
function getOrderPaymentMethod(order: Order): PaymentMethod {
  return order.payment_method ?? "card";
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  ordered_from_amazon: "Ordered from Amazon",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderTable({ orders, initialQuery }: { orders: Order[]; initialQuery?: string }) {
  const [query, setQuery] = React.useState(initialQuery || "");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = React.useState<PaymentMethod | "all">("all");

  const filtered = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (paymentFilter !== "all" && getOrderPaymentMethod(order) !== paymentFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const haystack = `${order.id} ${order.customer_name} ${order.customer_email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, name or email"
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="h-10 w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentMethod | "all")}>
          <SelectTrigger className="h-10 w-44">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment types</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cash_on_delivery">Cash on delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-100/40 py-16 text-center">
          <Package className="size-8 text-muted-foreground" />
          <p className="text-gray-500">No orders yet. They’ll appear here once Stripe is connected.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center text-gray-500">
          No orders match these filters.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const isCod = getOrderPaymentMethod(order) === "cash_on_delivery";
                return (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-blue-700">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {isCod ? <Truck className="size-3.5 text-blue-700" /> : <CreditCard className="size-3.5 text-gray-500" />}
                        {isCod ? "Cash on delivery" : "Card"}
                      </div>
                    </td>
                    <td className="p-3">{formatPrice(order.total)}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                      >
                        View details
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
