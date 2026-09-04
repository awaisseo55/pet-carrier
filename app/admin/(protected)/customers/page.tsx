import { CustomerTable, type CustomerRow } from "@/components/admin/customer-table";
import { getAllCustomersForAdmin } from "@/lib/customers";
import { getAllOrders } from "@/lib/orders";

export default async function AdminCustomersPage() {
  const [customers, orders] = await Promise.all([getAllCustomersForAdmin(), getAllOrders()]);

  const rows: CustomerRow[] = customers.map((customer) => {
    const customerOrders = orders.filter(
      (o) => o.customer_email.toLowerCase() === customer.email.toLowerCase()
    );
    return {
      ...customer,
      orderCount: customerOrders.length,
      totalSpent: customerOrders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + o.total, 0),
    };
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Customers</h1>
      <p className="mt-1 text-gray-500">
        {customers.length} registered account{customers.length === 1 ? "" : "s"}. Orders are matched by email,
        guest checkouts (no account) aren’t counted here, see the Orders page for every order.
      </p>

      <CustomerTable customers={rows} />
    </div>
  );
}
