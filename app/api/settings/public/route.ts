import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Only the fields safe to expose to the browser (pricing/shipping display),
// never contact_email etc that aren't needed client-side.
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    free_shipping_threshold: settings.free_shipping_threshold,
    standard_shipping_cost: settings.standard_shipping_cost,
    express_shipping_cost: settings.express_shipping_cost,
    next_day_shipping_cost: settings.next_day_shipping_cost,
    vat_rate: settings.vat_rate,
    currency: settings.currency,
  });
}
