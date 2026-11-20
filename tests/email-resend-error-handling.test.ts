import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Order } from "@/lib/types";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

// lib/email.ts decides whether it has a client at *import* time, so the env
// var must be set before the module is first imported.
process.env.RESEND_API_KEY = "test_key_do_not_log_me_123";
process.env.ADMIN_NOTIFICATION_EMAIL = "owner@example.com";
process.env.RESEND_FROM_EMAIL = "Pet Carrier <orders@pet-carrier.co.uk>";

const { sendOrderConfirmationEmail } = await import("@/lib/email");

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "abc123",
    payment_method: "card",
    stripe_session_id: "cs_test_1",
    customer_name: "Jane Doe",
    customer_email: "jane@example.com",
    shipping_address: { line1: "1 Test St", city: "London", postcode: "SW1A 1AA", country: "GB" },
    items: [
      {
        product_id: "p1",
        slug: "test",
        title: "Test Carrier",
        image: "https://images.pet-carrier.co.uk/x.webp",
        quantity: 1,
        price: 20,
        amazon_url: "https://www.amazon.co.uk/dp/X",
      },
    ],
    delivery_option: "standard",
    discount: 0,
    subtotal: 20,
    shipping_cost: 4.99,
    vat: 4.16,
    total: 24.99,
    status: "paid",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockSend.mockReset();
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("Resend error handling", () => {
  it("returns true and calls send with the expected shape on success", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_1" }, error: null });

    const result = await sendOrderConfirmationEmail(makeOrder());

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const [payload, options] = mockSend.mock.calls[0];
    expect(payload.to).toBe("jane@example.com");
    expect(payload.tags).toEqual([{ name: "category", value: "order_confirmation" }]);
    expect(options?.idempotencyKey).toBe("order-confirmation-abc123");
  });

  it("returns false when Resend resolves with an error object instead of throwing", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "domain not verified", statusCode: 422, name: "validation_error" } });

    const result = await sendOrderConfirmationEmail(makeOrder());

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("returns false and does not throw when the SDK call itself throws", async () => {
    mockSend.mockRejectedValue(new Error("network error"));

    await expect(sendOrderConfirmationEmail(makeOrder())).resolves.toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("never logs the Resend API key in any console output", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "bad request", statusCode: 400, name: "validation_error" } });
    await sendOrderConfirmationEmail(makeOrder());

    const loggedText = consoleErrorSpy.mock.calls.map((call) => JSON.stringify(call)).join(" ");
    expect(loggedText).not.toContain("test_key_do_not_log_me_123");
  });

  it("escapes the customer name before it reaches the HTML payload", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_2" }, error: null });
    await sendOrderConfirmationEmail(makeOrder({ customer_name: '<script>alert(1)</script>' }));

    const [payload] = mockSend.mock.calls[0];
    expect(payload.html).not.toContain("<script>alert(1)</script>");
    expect(payload.html).toContain("&lt;script&gt;");
  });
});
