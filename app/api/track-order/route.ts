import { NextResponse } from "next/server";
import { findOrderForTracking } from "@/lib/track-order";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!orderId || !email) {
    return NextResponse.json({ error: "Enter both your order number and email address." }, { status: 400 });
  }

  const order = await findOrderForTracking(orderId, email);
  if (!order) {
    return NextResponse.json(
      { error: "We couldn't find an order matching that order number and email address." },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
