import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrderById, updateOrder } from "@/lib/orders";
import { adminErrorResponse } from "@/lib/api-error";
import type { Order, OrderStatus } from "@/lib/types";

interface AdminOrderUpdateBody {
  status?: OrderStatus;
  payment_status?: Order["payment_status"];
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
}

const MAX_FIELD_LENGTH = 200;

function cleanOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_FIELD_LENGTH);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body: AdminOrderUpdateBody = await request.json();

  try {
    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const updates: Partial<Order> = {};
    if (body.status) updates.status = body.status;
    if (body.payment_status) updates.payment_status = body.payment_status;
    if (body.courier_name !== undefined) updates.courier_name = cleanOptionalString(body.courier_name);
    if (body.tracking_number !== undefined) updates.tracking_number = cleanOptionalString(body.tracking_number);
    if (body.tracking_url !== undefined) updates.tracking_url = cleanOptionalString(body.tracking_url);

    // Field updates only, this never sends a customer email as a side
    // effect. Notifications are a separate, explicit admin action, see
    // POST /api/admin/orders/[id]/notify and the "Order management" section
    // of CLAUDE.md for why.
    const updated = await updateOrder(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    return adminErrorResponse(error, "Could not update order.");
  }
}
