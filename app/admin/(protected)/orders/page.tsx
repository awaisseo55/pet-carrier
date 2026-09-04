import { OrderTable } from "@/components/admin/order-table";
import { getAllOrders } from "@/lib/orders";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [orders, { q }] = await Promise.all([getAllOrders(), searchParams]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Orders</h1>
      <p className="mt-1 text-gray-500">{orders.length} order(s) received.</p>

      <OrderTable orders={orders} initialQuery={q} />
    </div>
  );
}
