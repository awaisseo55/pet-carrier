import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/subscribers";
import type { SubscriberSource } from "@/lib/types";

const EMAIL_MAX = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SOURCES: SubscriberSource[] = ["welcome_popup", "footer"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const source = VALID_SOURCES.includes(body.source) ? (body.source as SubscriberSource) : "welcome_popup";

  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  await addSubscriber(email, source);

  return NextResponse.json({ ok: true });
}
