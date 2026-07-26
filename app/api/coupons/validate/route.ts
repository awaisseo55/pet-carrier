import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  const { code, subtotal } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "Please enter a code." }, { status: 400 });
  }

  const result = await validateCoupon(code, Number(subtotal) || 0);
  return NextResponse.json(result);
}
