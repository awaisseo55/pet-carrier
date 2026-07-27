import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteCoupon, updateCoupon } from "@/lib/coupons";
import { adminErrorResponse } from "@/lib/api-error";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();

  try {
    const coupon = await updateCoupon(id, updates);
    if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (error) {
    return adminErrorResponse(error, "Could not update coupon.");
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteCoupon(id);
  } catch (error) {
    return adminErrorResponse(error, "Could not delete coupon.");
  }

  return NextResponse.json({ ok: true });
}
