import Link from "next/link";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllProducts } from "@/lib/products";
import { getAllOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [products, orders] = await Promise.all([getAllProducts(), getAllOrders()]);
  const activeProducts = products.filter((p) => p.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const revenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-brown-soft">A quick look at your store.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="size-4 text-sage-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeProducts}</p>
            <p className="text-xs text-muted-foreground">{products.length} total, including drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <ShoppingCart className="size-4 text-terracotta-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingOrders}</p>
            <p className="text-xs text-muted-foreground">{orders.length} total orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <TrendingUp className="size-4 text-sage-600" />
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
          className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground shadow-warm hover:bg-terracotta-600"
        >
          Add Product from Amazon URL
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-full border-2 border-primary px-5 py-2.5 text-sm font-medium text-primary hover:bg-sage-50"
        >
          View Orders
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-cream-dark/40 p-5 text-sm text-muted-foreground">
        Product and order data currently lives in JSON files under <code>/data</code>. This is easy
        to inspect and edit by hand for now, and can be migrated to Supabase or Postgres once order
        volume grows.
      </div>
    </div>
  );
}
