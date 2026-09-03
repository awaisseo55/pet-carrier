import "server-only";
import { Resend } from "resend";
import type { Order } from "./types";
import { formatPrice } from "./utils";
import { getOrderPaymentMethod } from "./orders";
import { DELIVERY_OPTIONS } from "./constants";

/**
 * Centralised transactional email service. Every outbound email in the app
 * goes through sendTrackedEmail() below, so error handling, escaping,
 * idempotency and branding stay consistent in one place rather than
 * reimplemented per call site.
 *
 * Resend only sends mail, it does not receive it: a customer replying to one
 * of these emails goes straight to CUSTOMER_REPLY_TO_EMAIL's real inbox
 * (currently a Gmail address), it never comes back through this app or
 * Resend's API. See the "Transactional email" section in CLAUDE.md.
 */

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Safe defaults per the brief; real values are set as Vercel env vars and
// never hard-coded as the only source of truth.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Pet Carrier <orders@pet-carrier.co.uk>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "awaisseo55@gmail.com";
const CUSTOMER_REPLY_TO = process.env.CUSTOMER_REPLY_TO_EMAIL || "awaisseo55@gmail.com";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pet-carrier.co.uk";

// ---------------------------------------------------------------------
// Escaping and small formatting helpers
// ---------------------------------------------------------------------

/** Every customer-controlled value (name, address, message, tracking number...) must go through this before landing in an HTML string. */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only ever render a tracking URL as a clickable link when it's a genuine http(s) URL, never trust it blindly even though it's admin-entered. */
export function isSafeTrackingUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function deliveryLabel(option: Order["delivery_option"]): string {
  return DELIVERY_OPTIONS.find((o) => o.value === option)?.label || "Standard delivery";
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}

// ---------------------------------------------------------------------
// Shared branded template (white / blue / orange, matching the site)
// ---------------------------------------------------------------------

interface EmailLayoutOptions {
  preheader?: string;
  heading: string;
  bodyHtml: string;
}

function renderLayout({ preheader, heading, bodyHtml }: EmailLayoutOptions): string {
  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;">
            <tr>
              <td style="background-color:#1D4ED8;padding:20px 32px;">
                <span style="font-size:18px;font-weight:700;color:#FFFFFF;">Pet Carrier</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">${escapeHtml(heading)}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F9FAFB;border-top:1px solid #E5E7EB;">
                <p style="margin:0;font-size:12px;color:#6B7280;">
                  Pet Carrier &middot; pet-carrier.co.uk<br />
                  Questions about your order? Just reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background-color:#F97316;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;margin-top:8px;">${escapeHtml(label)}</a>`;
}

function itemsTableHtml(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#111827;">
          ${escapeHtml(item.title)}
          ${item.variant_label ? `<br/><span style="font-size:12px;color:#6B7280;">${escapeHtml(item.variant_label)}</span>` : ""}
          <br/><span style="font-size:12px;color:#6B7280;">Qty ${escapeHtml(item.quantity)}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#111827;text-align:right;white-space:nowrap;">
          ${escapeHtml(formatPrice(item.price * item.quantity))}
        </td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

function totalsHtml(order: Order): string {
  const rowsList: { label: string; value: string; strong?: boolean }[] = [
    { label: "Subtotal", value: formatPrice(order.subtotal) },
  ];
  if (order.discount > 0) {
    rowsList.push({ label: "Discount", value: `-${formatPrice(order.discount)}` });
  }
  rowsList.push({
    label: `Delivery (${deliveryLabel(order.delivery_option)})`,
    value: order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost),
  });
  rowsList.push({
    label: getOrderPaymentMethod(order) === "cash_on_delivery" ? "Total due on delivery" : "Total paid",
    value: formatPrice(order.total),
    strong: true,
  });

  const rows = rowsList
    .map(
      (row) => `
      <tr>
        <td style="padding:4px 0;font-size:${row.strong ? "15px" : "13px"};color:${row.strong ? "#111827" : "#6B7280"};font-weight:${row.strong ? "700" : "400"};">${escapeHtml(row.label)}</td>
        <td style="padding:4px 0;font-size:${row.strong ? "15px" : "13px"};color:${row.strong ? "#111827" : "#6B7280"};font-weight:${row.strong ? "700" : "400"};text-align:right;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid #E5E7EB;padding-top:8px;">${rows}</table>`;
}

function addressHtml(order: Order): string {
  const a = order.shipping_address;
  const lines = [a.line1, a.line2, a.city, a.county, a.postcode, a.country].filter(Boolean);
  return lines.map((line) => escapeHtml(line)).join("<br/>");
}

function addressText(order: Order): string {
  const a = order.shipping_address;
  return [a.line1, a.line2, a.city, a.county, a.postcode, a.country].filter(Boolean).join(", ");
}

// ---------------------------------------------------------------------
// Low-level send wrapper: escaping is the caller's job, this handles
// configuration checks, thrown-exception vs returned-error handling,
// idempotency and tagging.
// ---------------------------------------------------------------------

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
  replyTo?: string;
  idempotencyKey?: string;
}

async function sendTrackedEmail({ to, subject, html, text, tag, replyTo, idempotencyKey }: SendArgs): Promise<boolean> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set, skipping "${tag}" email to ${to}.`);
    return false;
  }

  try {
    const { error } = await resend.emails.send(
      {
        from: FROM_ADDRESS,
        to,
        replyTo,
        subject,
        html,
        text,
        tags: [{ name: "category", value: tag }],
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    // Resend can return an error object without throwing, this must be
    // checked explicitly or a failed send looks identical to a successful one.
    if (error) {
      console.error(`[email] Resend reported an error sending "${tag}" to ${to}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] Failed to send "${tag}" email to ${to}`, error);
    return false;
  }
}

// ---------------------------------------------------------------------
// Customer order confirmation
// ---------------------------------------------------------------------

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const isCod = getOrderPaymentMethod(order) === "cash_on_delivery";
  const name = firstName(order.customer_name);

  const paymentBlockHtml = isCod
    ? `<div style="margin:16px 0;padding:14px 16px;background-color:#FFF7ED;border:1px solid #FED7AA;border-radius:6px;">
         <p style="margin:0;font-size:14px;color:#9A3412;font-weight:600;">Payment method: Cash on delivery</p>
         <p style="margin:6px 0 0;font-size:13px;color:#7C2D12;">
           No online payment has been taken. <strong>${escapeHtml(formatPrice(order.total))} is due when your parcel arrives.</strong>
           Please have an accepted payment method ready for the courier.
         </p>
       </div>`
    : `<div style="margin:16px 0;padding:14px 16px;background-color:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;">
         <p style="margin:0;font-size:14px;color:#047857;font-weight:600;">Payment received</p>
         <p style="margin:6px 0 0;font-size:13px;color:#065F46;">Your card payment for this order has been confirmed.</p>
       </div>`;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;color:#374151;">Thanks for your order, ${escapeHtml(name)}. We're getting it ready.</p>
    <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">Order reference: <strong style="color:#111827;">#${escapeHtml(order.id)}</strong></p>
    ${itemsTableHtml(order)}
    ${totalsHtml(order)}
    ${paymentBlockHtml}
    <h2 style="margin:24px 0 8px;font-size:15px;color:#111827;">Delivery address</h2>
    <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${addressHtml(order)}</p>
    <h2 style="margin:24px 0 8px;font-size:15px;color:#111827;">What happens next</h2>
    <p style="margin:0;font-size:13px;color:#374151;">
      We'll email you again as soon as your order is dispatched, with tracking details where available.
    </p>
    <div style="margin-top:20px;">${button("View your orders", `${siteUrl}/account`)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#6B7280;">
      Any questions about this order? Just reply to this email and we'll help.
    </p>
  `;

  const html = renderLayout({
    heading: "Your order is confirmed",
    preheader: `Order #${order.id} confirmed, ${formatPrice(order.total)}`,
    bodyHtml,
  });

  const text = [
    `Thanks for your order, ${name}.`,
    ``,
    `Order reference: #${order.id}`,
    ``,
    ...order.items.map((i) => `${i.quantity} x ${i.title}${i.variant_label ? ` (${i.variant_label})` : ""} - ${formatPrice(i.price * i.quantity)}`),
    ``,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    order.discount > 0 ? `Discount: -${formatPrice(order.discount)}` : "",
    `Delivery (${deliveryLabel(order.delivery_option)}): ${order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}`,
    isCod ? `Total due on delivery: ${formatPrice(order.total)}` : `Total paid: ${formatPrice(order.total)}`,
    ``,
    isCod
      ? `Payment method: Cash on delivery. No online payment was taken. Please have an accepted payment method ready when your parcel arrives.`
      : `Payment method: Card. Your payment has been received.`,
    ``,
    `Delivery address: ${addressText(order)}`,
    ``,
    `We'll email you again once your order is dispatched.`,
    `Questions? Just reply to this email.`,
  ]
    .filter(Boolean)
    .join("\n");

  const sent = await sendTrackedEmail({
    to: order.customer_email,
    subject: `Your Pet Carrier order is confirmed (#${order.id})`,
    html,
    text,
    tag: "order_confirmation",
    replyTo: CUSTOMER_REPLY_TO,
    idempotencyKey: `order-confirmation-${order.id}`,
  });

  return sent;
}

// ---------------------------------------------------------------------
// Owner new-order notification
// ---------------------------------------------------------------------

export async function sendOwnerNewOrderEmail(order: Order): Promise<boolean> {
  const isCod = getOrderPaymentMethod(order) === "cash_on_delivery";

  const itemsRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;">
          ${escapeHtml(item.title)}${item.variant_label ? ` &mdash; ${escapeHtml(item.variant_label)}` : ""}<br/>
          <span style="color:#6B7280;">Qty ${escapeHtml(item.quantity)} &middot; SKU ${escapeHtml(item.variant_sku || "n/a")}</span><br/>
          ${item.amazon_url ? `<a href="${escapeHtml(item.amazon_url)}" style="color:#1D4ED8;">Amazon fulfilment link</a>` : `<span style="color:#B91C1C;">No Amazon link on record</span>`}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;text-align:right;">${escapeHtml(formatPrice(item.price * item.quantity))}</td>
      </tr>`
    )
    .join("");

  const paymentBannerHtml = isCod
    ? `<div style="padding:10px 16px;background-color:#FFF7ED;border-radius:6px;margin-bottom:16px;"><strong style="color:#9A3412;">CASH ON DELIVERY</strong> <span style="color:#7C2D12;">&middot; £${escapeHtml(order.total.toFixed(2))} due on delivery</span></div>`
    : `<div style="padding:10px 16px;background-color:#ECFDF5;border-radius:6px;margin-bottom:16px;"><strong style="color:#047857;">CARD PAYMENT RECEIVED</strong></div>`;

  const bodyHtml = `
    ${paymentBannerHtml}
    <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">Order reference: <strong style="color:#111827;">#${escapeHtml(order.id)}</strong></p>
    <h2 style="margin:20px 0 8px;font-size:15px;color:#111827;">Customer</h2>
    <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
      ${escapeHtml(order.customer_name)}<br/>
      ${escapeHtml(order.customer_email)}<br/>
      ${escapeHtml(order.customer_phone || "No phone number given")}
    </p>
    <h2 style="margin:20px 0 8px;font-size:15px;color:#111827;">Delivery address</h2>
    <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${addressHtml(order)}</p>
    ${order.shipping_address.delivery_instructions ? `<p style="margin:6px 0 0;font-size:13px;color:#374151;"><em>Instructions: ${escapeHtml(order.shipping_address.delivery_instructions)}</em></p>` : ""}
    <p style="margin:6px 0 0;font-size:13px;color:#374151;">Delivery option: ${escapeHtml(deliveryLabel(order.delivery_option))}</p>
    <h2 style="margin:20px 0 8px;font-size:15px;color:#111827;">Items</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsRows}</table>
    ${totalsHtml(order)}
    <div style="margin-top:20px;">${button("Open in admin", `${siteUrl}/admin/orders`)}</div>
  `;

  const html = renderLayout({
    heading: `New order: #${order.id}`,
    preheader: `${isCod ? "COD" : "Card"} order, ${formatPrice(order.total)}`,
    bodyHtml,
  });

  const text = [
    `NEW ORDER: ${isCod ? "CASH ON DELIVERY" : "CARD PAYMENT RECEIVED"}`,
    `Order reference: #${order.id}`,
    ``,
    `Customer: ${order.customer_name} <${order.customer_email}>`,
    `Phone: ${order.customer_phone || "not given"}`,
    ``,
    `Delivery address: ${addressText(order)}`,
    order.shipping_address.delivery_instructions ? `Instructions: ${order.shipping_address.delivery_instructions}` : "",
    `Delivery option: ${deliveryLabel(order.delivery_option)}`,
    ``,
    ...order.items.map(
      (i) =>
        `${i.quantity} x ${i.title}${i.variant_label ? ` (${i.variant_label})` : ""} - ${formatPrice(i.price * i.quantity)} - ${i.amazon_url || "NO AMAZON LINK"}`
    ),
    ``,
    `Total: ${formatPrice(order.total)}${isCod ? " (due on delivery)" : " (paid)"}`,
    ``,
    `Admin: ${siteUrl}/admin/orders`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendTrackedEmail({
    to: ADMIN_EMAIL,
    subject: `${isCod ? "[COD] " : ""}New order #${order.id} (${formatPrice(order.total)})`,
    html,
    text,
    tag: "owner_new_order",
    idempotencyKey: `owner-new-order-${order.id}`,
  });
}

// ---------------------------------------------------------------------
// Dispatch email
// ---------------------------------------------------------------------

export async function sendDispatchEmail(order: Order): Promise<boolean> {
  const name = firstName(order.customer_name);
  const hasTracking = Boolean(order.courier_name || order.tracking_number || order.tracking_url);
  const trackingLinkSafe = isSafeTrackingUrl(order.tracking_url);

  const trackingBlockHtml = hasTracking
    ? `<div style="margin:16px 0;padding:14px 16px;background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;">
         ${order.courier_name ? `<p style="margin:0 0 4px;font-size:13px;color:#1E40AF;"><strong>Courier:</strong> ${escapeHtml(order.courier_name)}</p>` : ""}
         ${order.tracking_number ? `<p style="margin:0 0 4px;font-size:13px;color:#1E40AF;"><strong>Tracking number:</strong> ${escapeHtml(order.tracking_number)}</p>` : ""}
         ${trackingLinkSafe ? `<div style="margin-top:8px;">${button("Track your parcel", order.tracking_url!)}</div>` : ""}
         <p style="margin:10px 0 0;font-size:12px;color:#3B82F6;">Tracking information can take a little time to update after dispatch.</p>
       </div>`
    : `<p style="margin:16px 0;font-size:13px;color:#374151;">Your order is on its way. We don't have separate tracking details for this delivery method.</p>`;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;color:#374151;">Good news, ${escapeHtml(name)}, your order is on its way.</p>
    <p style="margin:0;font-size:13px;color:#6B7280;">Order reference: <strong style="color:#111827;">#${escapeHtml(order.id)}</strong></p>
    ${trackingBlockHtml}
    <p style="margin:16px 0 0;font-size:13px;color:#374151;">Delivering to:<br/>${addressHtml(order)}</p>
    <div style="margin-top:20px;">${button("View your orders", `${siteUrl}/account`)}</div>
  `;

  const html = renderLayout({ heading: "Your order has been dispatched", bodyHtml });

  const text = [
    `Your order #${order.id} has been dispatched.`,
    ``,
    order.courier_name ? `Courier: ${order.courier_name}` : "",
    order.tracking_number ? `Tracking number: ${order.tracking_number}` : "",
    trackingLinkSafe ? `Track your parcel: ${order.tracking_url}` : "",
    !hasTracking ? "We don't have separate tracking details for this delivery method." : "Tracking information can take a little time to update after dispatch.",
    ``,
    `Delivering to: ${addressText(order)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendTrackedEmail({
    to: order.customer_email,
    subject: `Your Pet Carrier order has been dispatched (#${order.id})`,
    html,
    text,
    tag: "order_dispatched",
    replyTo: CUSTOMER_REPLY_TO,
    idempotencyKey: `order-dispatched-${order.id}`,
  });
}

// ---------------------------------------------------------------------
// Cancellation email
// ---------------------------------------------------------------------

export async function sendCancellationEmail(order: Order): Promise<boolean> {
  const name = firstName(order.customer_name);
  const isCod = getOrderPaymentMethod(order) === "cash_on_delivery";
  const wasPaid = order.payment_status === "paid";

  const paymentNoteHtml = isCod
    ? `<p style="margin:12px 0 0;font-size:13px;color:#374151;">No payment was taken for this order, so there is nothing to refund.</p>`
    : wasPaid
      ? `<p style="margin:12px 0 0;font-size:13px;color:#374151;">If a refund applies, we'll handle this separately and confirm once it's been processed.</p>`
      : `<p style="margin:12px 0 0;font-size:13px;color:#374151;">No payment had been taken for this order.</p>`;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;color:#374151;">Hello ${escapeHtml(name)}, order #${escapeHtml(order.id)} has been cancelled.</p>
    ${paymentNoteHtml}
    <p style="margin:16px 0 0;font-size:13px;color:#374151;">If this wasn't expected, or you have any questions, just reply to this email.</p>
  `;

  const html = renderLayout({ heading: "Your order has been cancelled", bodyHtml });

  const text = [
    `Order #${order.id} has been cancelled.`,
    ``,
    isCod
      ? "No payment was taken for this order, so there is nothing to refund."
      : wasPaid
        ? "If a refund applies, we'll handle this separately and confirm once it's been processed."
        : "No payment had been taken for this order.",
    ``,
    `Questions? Just reply to this email.`,
  ].join("\n");

  return sendTrackedEmail({
    to: order.customer_email,
    subject: `Your Pet Carrier order has been cancelled (#${order.id})`,
    html,
    text,
    tag: "order_cancelled",
    replyTo: CUSTOMER_REPLY_TO,
    idempotencyKey: `order-cancelled-${order.id}`,
  });
}

// ---------------------------------------------------------------------
// Delivered email
// ---------------------------------------------------------------------

export async function sendDeliveredEmail(order: Order): Promise<boolean> {
  const name = firstName(order.customer_name);

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;color:#374151;">Hello ${escapeHtml(name)}, order #${escapeHtml(order.id)} has been marked as delivered.</p>
    <p style="margin:0;font-size:13px;color:#374151;">We hope you and your pet are happy with it. If anything isn't right, just reply to this email and we'll sort it out.</p>
    <div style="margin-top:20px;">${button("View your orders", `${siteUrl}/account`)}</div>
  `;

  const html = renderLayout({ heading: "Your order has been delivered", bodyHtml });

  const text = [
    `Order #${order.id} has been marked as delivered.`,
    ``,
    `We hope you and your pet are happy with it. If anything isn't right, just reply to this email.`,
  ].join("\n");

  return sendTrackedEmail({
    to: order.customer_email,
    subject: `Your Pet Carrier order has arrived (#${order.id})`,
    html,
    text,
    tag: "order_delivered",
    replyTo: CUSTOMER_REPLY_TO,
    idempotencyKey: `order-delivered-${order.id}`,
  });
}

// ---------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------

export async function sendContactNotificationEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<boolean> {
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">New message from the contact form:</p>
    <p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>${escapeHtml(input.name)}</strong> &lt;${escapeHtml(input.email)}&gt;</p>
    <div style="margin-top:12px;padding:14px 16px;background-color:#F9FAFB;border-radius:6px;font-size:14px;color:#374151;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
  `;

  const html = renderLayout({ heading: "New contact form message", bodyHtml });
  const text = `New contact form message\n\nFrom: ${input.name} <${input.email}>\n\n${input.message}`;

  return sendTrackedEmail({
    to: ADMIN_EMAIL,
    subject: `New contact form message from ${input.name}`,
    html,
    text,
    tag: "contact_form",
    replyTo: input.email,
  });
}

// ---------------------------------------------------------------------
// Admin-only test email
// ---------------------------------------------------------------------

export async function sendTestEmail(kind: "owner" | "customer", to?: string): Promise<boolean> {
  const target = kind === "owner" ? ADMIN_EMAIL : to;
  if (!target) return false;

  const bodyHtml = `
    <p style="margin:0;font-size:14px;color:#374151;">
      This is a test email from the Pet Carrier admin panel, sent to confirm Resend is configured correctly.
      If you weren't expecting this, no action is needed.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#6B7280;">Sent ${new Date().toISOString()}</p>
  `;

  const html = renderLayout({ heading: "Pet Carrier test email", bodyHtml });
  const text = `This is a test email from the Pet Carrier admin panel.\nSent ${new Date().toISOString()}`;

  return sendTrackedEmail({
    to: target,
    subject: `Pet Carrier test email (${kind})`,
    html,
    text,
    tag: "test_email",
    replyTo: kind === "customer" ? CUSTOMER_REPLY_TO : undefined,
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(resend);
}
