import "server-only";
import Stripe from "stripe";

// TODO: add STRIPE_SECRET_KEY to .env.local before going live.
// Get your keys from https://dashboard.stripe.com/apikeys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY) && !process.env.STRIPE_SECRET_KEY?.includes("placeholder");
}
