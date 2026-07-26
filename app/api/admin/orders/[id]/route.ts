import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status }: { status: OrderStatus } = await request.json();

  await updateOrderStatus(id, status);
  return NextResponse.json({ ok: true });
}
