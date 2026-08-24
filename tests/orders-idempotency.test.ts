import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Order } from "@/lib/types";

let fakeOrders: Order[] = [];

vi.mock("@/lib/data-store", () => ({
  readJsonFile: vi.fn(async () => fakeOrders),
  writeJsonFile: vi.fn(async (_file: string, data: Order[]) => {
    fakeOrders = data;
  }),
}));

const { getOrderBySessionId, getOrderPaymentMethod, createOrder } = await import("@/lib/orders");

function baseOrder(overrides: Partial<Order> = {}): Omit<Order, "id"> {
  return {
    customer_name: "Test Customer",
    customer_email: "test@example.com",
    shipping_address: {
      line1: "1 Test St",
      city: "London",
      postcode: "SW1A 1AA",
      country: "GB",
    },
    items: [],
    delivery_option: "standard",
    discount: 0,
    subtotal: 10,
    shipping_cost: 0,
    vat: 1.67,
    total: 10,
    status: "paid",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  fakeOrders = [];
});

describe("getOrderBySessionId (webhook idempotency)", () => {
  it("finds an existing order created from the same Stripe session", async () => {
    await createOrder(baseOrder({ payment_method: "card", stripe_session_id: "cs_test_123" }));

    const found = await getOrderBySessionId("cs_test_123");
    expect(found).toBeDefined();
    expect(found?.stripe_session_id).toBe("cs_test_123");
  });

  it("returns undefined for a session id that hasn't produced an order yet, so the webhook proceeds to create one", async () => {
    const found = await getOrderBySessionId("cs_test_never_seen");
    expect(found).toBeUndefined();
  });

  it("does not match a cash-on-delivery order, which has no stripe_session_id", async () => {
    await createOrder(baseOrder({ payment_method: "cash_on_delivery" }));

    const found = await getOrderBySessionId("cs_test_anything");
    expect(found).toBeUndefined();
  });

  it("a second webhook delivery for the same session finds the already-created order instead of creating a duplicate", async () => {
    const first = await createOrder(baseOrder({ payment_method: "card", stripe_session_id: "cs_test_dup" }));

    // Simulates the webhook route's own duplicate check on a retried delivery.
    const secondAttempt = await getOrderBySessionId("cs_test_dup");
    expect(secondAttempt?.id).toBe(first.id);

    const allForThisSession = (await import("@/lib/orders")).getAllOrders
      ? await (await import("@/lib/orders")).getAllOrders()
      : [];
    const matching = allForThisSession.filter((o) => o.stripe_session_id === "cs_test_dup");
    expect(matching).toHaveLength(1);
  });
});

describe("getOrderPaymentMethod", () => {
  it("defaults to card for orders created before payment_method existed", () => {
    const legacyOrder = { ...baseOrder(), id: "legacy-1" } as Order;
    delete (legacyOrder as { payment_method?: string }).payment_method;
    expect(getOrderPaymentMethod(legacyOrder)).toBe("card");
  });

  it("respects an explicit cash_on_delivery payment method", () => {
    const order = { ...baseOrder({ payment_method: "cash_on_delivery" }), id: "cod-1" } as Order;
    expect(getOrderPaymentMethod(order)).toBe("cash_on_delivery");
  });
});
