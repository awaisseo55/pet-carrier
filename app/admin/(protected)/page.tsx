import Link from "next/link";
import { FolderTree, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllProducts } from "@/lib/products";
import { getAllOrders } from "@/lib/orders";
import { getAllCategoryNodes } from "@/lib/category-store";
import { formatPrice } from "@/lib/utils";
import { PublishAllButton } from "@/components/admin/publish-all-button";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export default async function AdminDashboardPage() {
  const [products, orders, categories] = await Promise.all([
    getAllProducts(),
    getAllOrders(),
    getAllCategoryNodes(),
  ]);
  const activeProducts = products.filter((p) => p.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === "pending_payment").length;
  const revenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-gray-500">A quick look at your store.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeProducts}</p>
            <p className="text-xs text-muted-foreground">{products.length} total, including drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <FolderTree className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Across carriers, strollers, beds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <ShoppingCart className="size-4 text-coral-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingOrders}</p>
            <p className="text-xs text-muted-foreground">{orders.length} total orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <TrendingUp className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPrice(revenue)}</p>
            <p className="text-xs text-muted-foreground">From paid orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-coral-600"
        >
          Add Product from Amazon URL
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-gray-50"
        >
          Manage Categories
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-gray-50"
        >
          View Orders
        </Link>
        <PublishAllButton />
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-lg font-semibold text-foreground">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-gray-500">
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-blue-700">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="p-3">{order.customer_name}</td>
                    <td className="p-3">{formatPrice(order.total)}</td>
                    <td className="p-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-border bg-gray-50 p-5 text-sm text-muted-foreground">
        Product, category and order data currently lives in JSON files under <code>/data</code>. This is easy to
        inspect and edit by hand for now, and can be migrated to Supabase or Postgres once order volume grows.
      </div>
    </div>
  );
}
