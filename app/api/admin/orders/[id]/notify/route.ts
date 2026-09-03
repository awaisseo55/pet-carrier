import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrderById, updateOrder } from "@/lib/orders";
import { sendDispatchEmail, sendCancellationEmail, sendDeliveredEmail } from "@/lib/email";
import { canSendOrderNotification, type OrderNotificationType } from "@/lib/order-notifications";
import { adminErrorResponse } from "@/lib/api-error";
import type { Order } from "@/lib/types";

const MARKER_FIELD: Record<OrderNotificationType, keyof Order> = {
  dispatched: "dispatch_email_sent_at",
  cancelled: "cancellation_email_sent_at",
  delivered: "delivered_email_sent_at",
};

const SEND_FN: Record<OrderNotificationType, (order: Order) => Promise<boolean>> = {
  dispatched: sendDispatchEmail,
  cancelled: sendCancellationEmail,
  delivered: sendDeliveredEmail,
};

const VALID_TYPES: OrderNotificationType[] = ["dispatched", "cancelled", "delivered"];

/**
 * Explicit, admin-triggered "send this customer their status email" action.
 * Deliberately not a side effect of the status PATCH, see CLAUDE.md's
 * "Order management" section: the admin sets the order to "Dispatched"
 * (entering tracking details first), reviews everything, then presses
 * "Send notification to customer" here on their own terms.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const type = body?.type;

  if (typeof type !== "string" || !VALID_TYPES.includes(type as OrderNotificationType)) {
    return NextResponse.json({ error: "Invalid notification type." }, { status: 400 });
  }
  const notificationType = type as OrderNotificationType;

  try {
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const marker = MARKER_FIELD[notificationType];
    const alreadySentAt = order[marker] as string | undefined;

    if (!canSendOrderNotification({ status: order.status, type: notificationType, alreadySentAt })) {
      const reason = alreadySentAt
        ? "This notification has already been sent for this order."
        : `The order needs to be marked "${notificationType}" before this notification can be sent.`;
      return NextResponse.json({ error: reason }, { status: 400 });
    }

    const sent = await SEND_FN[notificationType](order);
    if (!sent) {
      return NextResponse.json(
        { error: "The email could not be sent. Check RESEND_API_KEY is configured correctly." },
        { status: 502 }
      );
    }

    const updated = await updateOrder(id, { [marker]: new Date().toISOString() } as Partial<Order>);
    return NextResponse.json({ order: updated });
  } catch (error) {
    return adminErrorResponse(error, "Could not send notification.");
  }
}
