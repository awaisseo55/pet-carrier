import "server-only";
import { Resend } from "resend";
import type { Order } from "./types";
import { formatPrice } from "./utils";

// TODO: add RESEND_API_KEY to .env.local, and verify your sending domain at
// https://resend.com/domains before going live.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_ADDRESS = "Pet Carrier <orders@pet-carrier.co.uk>";
const OWNER_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "hello@pet-carrier.co.uk";

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping order confirmation email. TODO: configure Resend.");
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;">${item.title} &times; ${item.quantity}</td><td style="padding:8px 0;text-align:right;">${formatPrice(item.price * item.quantity)}</td></tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: order.customer_email,
      subject: `Your Pet Carrier order is confirmed (#${order.id})`,
      html: `
        <div style="font-family: sans-serif; color: #3D3532;">
          <h1 style="color:#4f6b54;">Thanks for your order, ${order.customer_name}!</h1>
          <p>We're getting your order ready. Here's what you ordered:</p>
          <table style="width:100%; border-collapse: collapse;">${itemsHtml}</table>
          <p style="margin-top:16px;"><strong>Total: ${formatPrice(order.total)}</strong></p>
          <p>We'll email you again once your order has been dispatched.</p>
          <p>Warm regards,<br/>The Pet Carrier team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email", error);
  }
}

export async function sendOwnerNotificationEmail(order: Order): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping owner notification email. TODO: configure Resend.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: OWNER_EMAIL,
      subject: `New order received: #${order.id} (${formatPrice(order.total)})`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>New order from ${order.customer_name}</h2>
          <p>${order.items.length} item(s), total ${formatPrice(order.total)}.</p>
          <p>View it in the admin panel under Orders.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send owner notification email", error);
  }
}
