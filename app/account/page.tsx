import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customers";
import { getAllOrders } from "@/lib/orders";
import { LogoutButton } from "@/components/account/logout-button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Account",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  ordered_from_amazon: "Ordered",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const allOrders = await getAllOrders();
  const orders = allOrders.filter((o) => o.customer_email.toLowerCase() === customer.email.toLowerCase());

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Hi, {customer.name}</h1>
          <p className="mt-1 text-gray-500">{customer.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Order History</h2>
        {orders.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-100/40 py-14 text-center">
            <Package className="size-8 text-muted-foreground" />
            <p className="text-gray-500">You haven’t placed any orders yet.</p>
            <Link href="/carriers" className="text-emerald-700 hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Order #{order.id}</span>
                  <Badge>{statusLabels[order.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  &middot; {order.items.length} item(s) &middot; {formatPrice(order.total)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Addresses</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Saved addresses will appear here after your first order. For now, addresses are entered
          during checkout.
        </p>
      </div>
    </div>
  );
}
