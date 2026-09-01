import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Order } from "@/lib/types";

let fakeOrders: Order[] = [];

vi.mock("@/lib/data-store", () => ({
  readJsonFile: vi.fn(async () => fakeOrders),
  writeJsonFile: vi.fn(async (_file: string, data: Order[]) => {
    fakeOrders = data;
  }),
}));

vi.mock("resend", () => ({ Resend: vi.fn() }));

const { findOrderForTracking, matchesOrderEmail, toPublicOrderTracking } = await import("@/lib/track-order");
const { createOrder } = await import("@/lib/orders");

function baseOrder(overrides: Partial<Order> = {}): Omit<Order, "id"> {
  return {
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    customer_phone: "07123456789",
    shipping_address: {
      line1: "1 Test St",
      city: "London",
      postcode: "SW1A 1AA",
      country: "GB",
    },
    items: [
      {
        product_id: "p1",
        slug: "test-carrier",
        title: "Test Carrier",
        image: "https://images.pet-carrier.co.uk/test.webp",
        quantity: 2,
        price: 25,
        amazon_url: "https://amazon.co.uk/dp/B000000000",
      },
    ],
    delivery_option: "standard",
    discount: 0,
    subtotal: 50,
    shipping_cost: 0,
    vat: 8.33,
    total: 50,
    status: "dispatched",
    payment_status: "paid",
    courier_name: "Royal Mail",
    tracking_number: "AB123456789GB",
    tracking_url: "https://www.royalmail.com/track-your-item#/AB123456789GB",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  fakeOrders = [];
});

describe("matchesOrderEmail", () => {
  it("matches regardless of case and surrounding whitespace", () => {
    const order = { customer_email: "Jane@Example.com" } as Order;
    expect(matchesOrderEmail(order, " jane@example.com ")).toBe(true);
  });

  it("rejects a different email", () => {
    const order = { customer_email: "jane@example.com" } as Order;
    expect(matchesOrderEmail(order, "someone-else@example.com")).toBe(false);
  });
});

describe("toPublicOrderTracking", () => {
  it("strips the shipping address, phone and payment details", () => {
    const order = { ...baseOrder(), id: "order-1" } as Order;
    const publicOrder = toPublicOrderTracking(order);
    expect(publicOrder).not.toHaveProperty("shipping_address");
    expect(publicOrder).not.toHaveProperty("customer_phone");
    expect(publicOrder).not.toHaveProperty("customer_email");
    expect(publicOrder).not.toHaveProperty("payment_status");
    expect(publicOrder.courier_name).toBe("Royal Mail");
    expect(publicOrder.tracking_number).toBe("AB123456789GB");
  });

  it("drops an unsafe tracking URL rather than passing it through", () => {
    const order = { ...baseOrder({ tracking_url: "javascript:alert(1)" }), id: "order-2" } as Order;
    expect(toPublicOrderTracking(order).tracking_url).toBeUndefined();
  });
});

describe("findOrderForTracking", () => {
  it("returns the order when the id and email both match", async () => {
    const created = await createOrder(baseOrder());
    const found = await findOrderForTracking(created.id, "jane@example.com");
    expect(found?.id).toBe(created.id);
  });

  it("returns null for a correct id but wrong email, without revealing the order exists", async () => {
    const created = await createOrder(baseOrder());
    const found = await findOrderForTracking(created.id, "not-jane@example.com");
    expect(found).toBeNull();
  });

  it("returns null for an order id that doesn't exist", async () => {
    const found = await findOrderForTracking("nonexistent-id", "jane@example.com");
    expect(found).toBeNull();
  });
});
