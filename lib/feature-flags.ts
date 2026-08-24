import "server-only";

/** Cash on delivery is off unless explicitly enabled, checked by both the checkout UI's public settings endpoint and the COD API route itself so the two can never disagree. */
export function isCodEnabled(): boolean {
  return process.env.ENABLE_CASH_ON_DELIVERY === "true";
}
