import { NextResponse } from "next/server";
import { Resend } from "resend";

// TODO: add RESEND_API_KEY to .env.local to actually deliver contact form
// submissions. Until then, messages are only logged to the server console.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const OWNER_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "hello@pet-carrier.co.uk";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }

  if (!resend) {
    console.warn("RESEND_API_KEY not set, logging contact message instead of emailing it.", {
      name,
      email,
      message,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    await resend.emails.send({
      from: "Pet Carrier Website <no-reply@pet-carrier.co.uk>",
      to: OWNER_EMAIL,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      html: `<p><strong>${name}</strong> (${email}) wrote:</p><p>${message}</p>`,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send contact email", error);
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }
}
