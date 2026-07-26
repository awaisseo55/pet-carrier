import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { code, type, value, min_order_value, valid_from, valid_until, usage_limit, is_active } = body;

  if (!code || !type || value === undefined) {
    return NextResponse.json({ error: "Code, type and value are required." }, { status: 400 });
  }

  const coupon = await createCoupon({
    code: code.toUpperCase(),
    type,
    value: Number(value),
    min_order_value: Number(min_order_value) || 0,
    valid_from: valid_from || new Date().toISOString(),
    valid_until: valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    usage_limit: Number(usage_limit) || 0,
    is_active: is_active ?? true,
  });

  return NextResponse.json({ coupon });
}
