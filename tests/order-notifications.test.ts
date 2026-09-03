import { describe, it, expect } from "vitest";
import { canSendOrderNotification } from "@/lib/order-notifications";

describe("canSendOrderNotification", () => {
  it("allows sending when the order status matches the notification type and nothing sent yet", () => {
    expect(
      canSendOrderNotification({ status: "dispatched", type: "dispatched", alreadySentAt: undefined })
    ).toBe(true);
  });

  it("does not allow resending when the marker is already set", () => {
    expect(
      canSendOrderNotification({
        status: "dispatched",
        type: "dispatched",
        alreadySentAt: "2026-01-01T00:00:00.000Z",
      })
    ).toBe(false);
  });

  it("does not allow sending a notification whose status the order hasn't reached", () => {
    expect(canSendOrderNotification({ status: "paid", type: "dispatched", alreadySentAt: undefined })).toBe(
      false
    );
    expect(
      canSendOrderNotification({ status: "ordered_from_amazon", type: "delivered", alreadySentAt: undefined })
    ).toBe(false);
  });

  it("covers all three notification types: dispatched, cancelled, delivered", () => {
    for (const type of ["dispatched", "cancelled", "delivered"] as const) {
      expect(canSendOrderNotification({ status: type, type, alreadySentAt: undefined })).toBe(true);
    }
  });
});
