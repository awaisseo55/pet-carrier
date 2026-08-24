import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendTestEmail } from "@/lib/email";

/**
 * Admin-only (or local dev) utility to confirm Resend is actually wired up
 * correctly, never automatically triggered and never callable without an
 * admin session outside of development.
 */
export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const kind = body.kind === "customer" ? "customer" : "owner";
  const to = typeof body.to === "string" ? body.to.trim() : undefined;

  if (kind === "customer" && (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))) {
    return NextResponse.json({ error: "Provide a valid email address for the customer-style test." }, { status: 400 });
  }

  const sent = await sendTestEmail(kind, to);
  if (!sent) {
    return NextResponse.json({ error: "Could not send the test email. Check RESEND_API_KEY is set and check server logs." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
