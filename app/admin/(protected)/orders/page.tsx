import Link from "next/link";
import { ChevronRight, CreditCard, Package, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { getAllOrders, getOrderPaymentMethod } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Orders</h1>
      <p className="mt-1 text-gray-500">{orders.length} order(s) received.</p>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-100/40 py-16 text-center">
          <Package className="size-8 text-muted-foreground" />
          <p className="text-gray-500">No orders yet. They’ll appear here once Stripe is connected.</p>
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
              {orders.map((order) => {
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
