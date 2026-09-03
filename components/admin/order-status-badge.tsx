import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  ordered_from_amazon: "Ordered from Amazon",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<OrderStatus, NonNullable<VariantProps<typeof badgeVariants>["variant"]>> = {
  pending_payment: "warning",
  paid: "success",
  ordered_from_amazon: "default",
  dispatched: "default",
  delivered: "success",
  cancelled: "alert",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
