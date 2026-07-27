import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/orders";
import { adminErrorResponse } from "@/lib/api-error";
import type { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status }: { status: OrderStatus } = await request.json();

  try {
    await updateOrderStatus(id, status);
  } catch (error) {
    return adminErrorResponse(error, "Could not update order status.");
  }

  return NextResponse.json({ ok: true });
}
