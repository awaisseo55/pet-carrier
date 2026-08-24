import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Product } from "@/lib/types";

const mockGetProductById = vi.fn();
const mockGetSettings = vi.fn();
const mockValidateCoupon = vi.fn();

vi.mock("@/lib/products", () => ({
  getProductById: (...args: unknown[]) => mockGetProductById(...args),
}));
vi.mock("@/lib/settings", () => ({
  getSettings: () => mockGetSettings(),
}));
vi.mock("@/lib/coupons", () => ({
  validateCoupon: (...args: unknown[]) => mockValidateCoupon(...args),
}));

const { calculateCheckout, CheckoutValidationError } = await import("@/lib/checkout-calculation");

const SETTINGS = {
  free_shipping_threshold: 50,
  standard_shipping_cost: 4.99,
  express_shipping_cost: 7.99,
  next_day_shipping_cost: 9.99,
  vat_rate: 20,
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    slug: "test-carrier",
    title: "Test Carrier",
    description: "",
    short_description: "",
    features: [],
    specifications: {},
    price: 20,
    compare_at_price: null,
    sku: "SKU-1",
    stock_status: "in_stock",
    images: ["https://images.pet-carrier.co.uk/test.webp"],
    category_slugs: [],
    size_range: "",
    weight_capacity: "",
    brand: "Test",
    amazon_asin: "B000000001",
    amazon_url: "https://www.amazon.co.uk/dp/B000000001",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    markup_percentage: 0,
    ...overrides,
  } as Product;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockGetSettings.mockResolvedValue(SETTINGS);
  mockValidateCoupon.mockResolvedValue({ valid: false, error: "not used" });
});

describe("calculateCheckout", () => {
  it("computes subtotal, shipping and VAT for a simple basket", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ price: 20 }));

    const result = await calculateCheckout({
      lines: [{ product_id: "prod-1", quantity: 2 }],
      deliveryOption: "standard",
    });

    expect(result.subtotal).toBe(40);
    // Below the £50 free-shipping threshold.
    expect(result.shippingCost).toBe(4.99);
    expect(result.total).toBeCloseTo(44.99, 2);
    expect(result.items[0].price).toBe(20);
    expect(result.items[0].quantity).toBe(2);
  });

  it("gives free standard shipping at or above the threshold", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ price: 50 }));

    const result = await calculateCheckout({
      lines: [{ product_id: "prod-1", quantity: 1 }],
      deliveryOption: "standard",
    });

    expect(result.shippingCost).toBe(0);
    expect(result.total).toBe(50);
  });

  it("always charges express/next-day shipping regardless of the free threshold", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ price: 100 }));

    const result = await calculateCheckout({
      lines: [{ product_id: "prod-1", quantity: 1 }],
      deliveryOption: "next_day",
    });

    expect(result.shippingCost).toBe(9.99);
  });

  it("applies a valid coupon discount before VAT", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ price: 100 }));
    mockValidateCoupon.mockResolvedValue({ valid: true, discountAmount: 10 });

    const result = await calculateCheckout({
      lines: [{ product_id: "prod-1", quantity: 1 }],
      deliveryOption: "standard",
      couponCode: "save10",
    });

    expect(result.discount).toBe(10);
    expect(result.appliedCouponCode).toBe("SAVE10");
    // subtotal 100, discount 10 -> 90 + free shipping (>=50) = 90
    expect(result.total).toBe(90);
  });

  it("ignores an invalid coupon rather than failing the whole checkout", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ price: 100 }));
    mockValidateCoupon.mockResolvedValue({ valid: false, error: "expired" });

    const result = await calculateCheckout({
      lines: [{ product_id: "prod-1", quantity: 1 }],
      deliveryOption: "standard",
      couponCode: "expired-code",
    });

    expect(result.discount).toBe(0);
    expect(result.appliedCouponCode).toBeUndefined();
  });

  it("rejects an empty basket", async () => {
    await expect(calculateCheckout({ lines: [], deliveryOption: "standard" })).rejects.toThrow(
      CheckoutValidationError
    );
  });

  it("rejects a missing product", async () => {
    mockGetProductById.mockResolvedValue(undefined);

    await expect(
      calculateCheckout({ lines: [{ product_id: "ghost", quantity: 1 }], deliveryOption: "standard" })
    ).rejects.toThrow(CheckoutValidationError);
  });

  it("rejects an inactive product", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ is_active: false }));

    await expect(
      calculateCheckout({ lines: [{ product_id: "prod-1", quantity: 1 }], deliveryOption: "standard" })
    ).rejects.toThrow(CheckoutValidationError);
  });

  it("rejects an out-of-stock product", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ stock_status: "out_of_stock" }));

    await expect(
      calculateCheckout({ lines: [{ product_id: "prod-1", quantity: 1 }], deliveryOption: "standard" })
    ).rejects.toThrow(CheckoutValidationError);
  });

  it("rejects an out-of-stock variant even when the base product is in stock", async () => {
    mockGetProductById.mockResolvedValue(
      makeProduct({
        stock_status: "in_stock",
        variants: [
          {
            id: "v1",
            type: "size",
            size: "L",
            price: 25,
            sku: "SKU-1-L",
            inStock: false,
          },
        ],
      })
    );

    await expect(
      calculateCheckout({
        lines: [{ product_id: "prod-1", variant_sku: "SKU-1-L", quantity: 1 }],
        deliveryOption: "standard",
      })
    ).rejects.toThrow(CheckoutValidationError);
  });

  it("rejects an invalid or zero quantity", async () => {
    mockGetProductById.mockResolvedValue(makeProduct());

    await expect(
      calculateCheckout({ lines: [{ product_id: "prod-1", quantity: 0 }], deliveryOption: "standard" })
    ).rejects.toThrow(CheckoutValidationError);

    await expect(
      calculateCheckout({ lines: [{ product_id: "prod-1", quantity: 1.5 }], deliveryOption: "standard" })
    ).rejects.toThrow(CheckoutValidationError);
  });

  it("ignores a manipulated client-supplied price and uses the server product price instead", async () => {
    mockGetProductById.mockResolvedValue(makeProduct({ price: 49.99 }));

    // A real client can only ever send product_id/variant_sku/quantity, but
    // simulate a tampered payload smuggling extra fields to prove they're
    // never read.
    const tamperedLine = { product_id: "prod-1", quantity: 1, price: 0.01, title: "Free stuff" } as unknown as {
      product_id: string;
      quantity: number;
    };

    const result = await calculateCheckout({ lines: [tamperedLine], deliveryOption: "standard" });

    expect(result.items[0].price).toBe(49.99);
    expect(result.items[0].title).toBe("Test Carrier");
    expect(result.subtotal).toBe(49.99);
  });

  it("looks up the amazon fulfilment URL server-side and never trusts a client-supplied one", async () => {
    mockGetProductById.mockResolvedValue(
      makeProduct({ amazon_url: "https://www.amazon.co.uk/dp/REALASIN" })
    );

    const tamperedLine = {
      product_id: "prod-1",
      quantity: 1,
      amazon_url: "https://evil.example.com",
    } as unknown as { product_id: string; quantity: number };

    const result = await calculateCheckout({ lines: [tamperedLine], deliveryOption: "standard" });

    expect(result.items[0].amazon_url).toBe("https://www.amazon.co.uk/dp/REALASIN");
  });
});
