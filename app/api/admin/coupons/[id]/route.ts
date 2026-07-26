import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteCoupon, updateCoupon } from "@/lib/coupons";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();
  const coupon = await updateCoupon(id, updates);
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  return NextResponse.json({ coupon });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteCoupon(id);
  return NextResponse.json({ ok: true });
}
