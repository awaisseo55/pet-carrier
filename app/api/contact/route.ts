import { NextResponse } from "next/server";
import { validateContactForm } from "@/lib/contact-validation";
import { sendContactNotificationEmail, isEmailConfigured } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = validateContactForm(body);

  if (!result.valid || !result.data) {
    return NextResponse.json({ error: result.error || "Please check your details and try again." }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    console.warn("RESEND_API_KEY not set, logging contact message instead of emailing it.", {
      name: result.data.name,
      email: result.data.email,
    });
    return NextResponse.json({ ok: true });
  }

  const sent = await sendContactNotificationEmail(result.data);
  if (!sent) {
    // Don't tell the visitor their message went through when it didn't.
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
