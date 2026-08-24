import "server-only";
import { getProductById } from "./products";
import { getSettings } from "./settings";
import { validateCoupon } from "./coupons";
import { variantLabel } from "./variants";
import { PRODUCT_PLACEHOLDER } from "./constants";
import type { DeliveryOption, OrderItem } from "./types";

/**
 * Shared, server-only pricing engine used by both the Stripe checkout
 * session route and the cash-on-delivery route, so there is exactly one
 * place that decides what a basket actually costs. Nothing here trusts the
 * browser: the client sends only { product_id, variant_sku?, quantity }
 * references, every price, title, image and fulfilment link is looked up
 * fresh from the product catalogue.
 */

const MAX_LINE_QUANTITY = 20;
const MAX_LINES = 50;

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

export interface CheckoutLine {
  product_id: string;
  variant_sku?: string;
  quantity: number;
}

export interface CalculatedCheckout {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  appliedCouponCode?: string;
  shippingCost: number;
  vat: number;
  total: number;
  deliveryOption: DeliveryOption;
}

const VALID_DELIVERY_OPTIONS: DeliveryOption[] = ["standard", "express", "next_day"];

export async function calculateCheckout(params: {
  lines: CheckoutLine[];
  deliveryOption: DeliveryOption;
  couponCode?: string;
}): Promise<CalculatedCheckout> {
  const { lines, couponCode } = params;

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new CheckoutValidationError("Your basket is empty.");
  }
  if (lines.length > MAX_LINES) {
    throw new CheckoutValidationError("There are too many different items in this order.");
  }

  const deliveryOption: DeliveryOption = VALID_DELIVERY_OPTIONS.includes(params.deliveryOption)
    ? params.deliveryOption
    : "standard";

  const items: OrderItem[] = [];

  for (const line of lines) {
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new CheckoutValidationError("One of the items in your basket has an invalid quantity.");
    }
    if (typeof line.product_id !== "string" || !line.product_id) {
      throw new CheckoutValidationError("One of the items in your basket is no longer available.");
    }

    const product = await getProductById(line.product_id);
    if (!product || !product.is_active) {
      throw new CheckoutValidationError("One of the items in your basket is no longer available. Please review your basket and try again.");
    }

    const variant = line.variant_sku
      ? product.variants?.find((v) => v.sku === line.variant_sku)
      : undefined;

    if (line.variant_sku && !variant) {
      throw new CheckoutValidationError(`The selected option for "${product.title}" is no longer available. Please review your basket and try again.`);
    }

    const inStock = variant ? variant.inStock : product.stock_status !== "out_of_stock";
    if (!inStock) {
      throw new CheckoutValidationError(`"${product.title}"${variant ? ` (${variantLabel(variant)})` : ""} is currently out of stock.`);
    }

    const price = variant?.price ?? product.price;
    const image = variant?.colourImage || product.images[0] || PRODUCT_PLACEHOLDER;
    // Internal fulfilment link, looked up server-side only, never accepted
    // from the client and never included in anything the customer sees.
    const amazonUrl = variant?.amazonUrl || product.amazon_url || "";

    items.push({
      product_id: product.id,
      slug: product.slug,
      title: product.title,
      image,
      quantity,
      price,
      amazon_url: amazonUrl,
      variant_sku: variant?.sku,
      variant_label: variant ? variantLabel(variant) : undefined,
    });
  }

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

  const settings = await getSettings();

  let discount = 0;
  let appliedCouponCode: string | undefined;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    if (result.valid && result.discountAmount) {
      discount = result.discountAmount;
      appliedCouponCode = couponCode.toUpperCase();
    }
  }

  const shippingByOption: Record<DeliveryOption, number> = {
    standard: subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_shipping_cost,
    express: settings.express_shipping_cost,
    next_day: settings.next_day_shipping_cost,
  };
  const shippingCost = shippingByOption[deliveryOption];

  const vatBase = Math.max(0, subtotal - discount);
  const vat = Math.round(vatBase * (settings.vat_rate / (100 + settings.vat_rate)) * 100) / 100;
  const total = Math.round((vatBase + shippingCost) * 100) / 100;

  return {
    items,
    subtotal,
    discount,
    appliedCouponCode,
    shippingCost,
    vat,
    total,
    deliveryOption,
  };
}
