import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { OrderDetail } from "@/components/admin/order-detail";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return <OrderDetail order={order} />;
}
