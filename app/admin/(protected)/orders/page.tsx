import { Package } from "lucide-react";
import { OrderRow } from "@/components/admin/order-row";
import { getAllOrders } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Orders</h1>
      <p className="mt-1 text-brown-soft">{orders.length} order(s) received.</p>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-cream-dark/40 py-16 text-center">
          <Package className="size-8 text-muted-foreground" />
          <p className="text-brown-soft">No orders yet. They’ll appear here once Stripe is connected.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reorder</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
