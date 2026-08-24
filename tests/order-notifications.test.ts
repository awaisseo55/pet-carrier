import { describe, it, expect } from "vitest";
import { shouldSendTransitionEmail } from "@/lib/order-notifications";

describe("shouldSendTransitionEmail", () => {
  it("sends when the status genuinely changed to dispatched and nothing sent yet", () => {
    expect(
      shouldSendTransitionEmail({ statusChanged: true, newStatus: "dispatched", alreadySentAt: undefined })
    ).toBe(true);
  });

  it("does not resend when the marker is already set (duplicate/retried update)", () => {
    expect(
      shouldSendTransitionEmail({
        statusChanged: true,
        newStatus: "dispatched",
        alreadySentAt: "2026-01-01T00:00:00.000Z",
      })
    ).toBe(false);
  });

  it("does not send when the status didn't actually change (e.g. an unrelated tracking-field edit)", () => {
    expect(
      shouldSendTransitionEmail({ statusChanged: false, newStatus: "dispatched", alreadySentAt: undefined })
    ).toBe(false);
  });

  it("does not send for statuses that have no associated email", () => {
    expect(shouldSendTransitionEmail({ statusChanged: true, newStatus: "paid", alreadySentAt: undefined })).toBe(
      false
    );
    expect(
      shouldSendTransitionEmail({ statusChanged: true, newStatus: "ordered_from_amazon", alreadySentAt: undefined })
    ).toBe(false);
  });

  it("covers all three transactional statuses: dispatched, cancelled, delivered", () => {
    for (const status of ["dispatched", "cancelled", "delivered"] as const) {
      expect(shouldSendTransitionEmail({ statusChanged: true, newStatus: status, alreadySentAt: undefined })).toBe(
        true
      );
    }
  });
});
