import { describe, it, expect, vi } from "vitest";

vi.mock("resend", () => ({ Resend: vi.fn() }));

const { escapeHtml, isSafeTrackingUrl } = await import("@/lib/email");

describe("escapeHtml", () => {
  it("escapes the five dangerous HTML characters", () => {
    expect(escapeHtml(`<script>alert('hi')</script> & "quotes"`)).toBe(
      "&lt;script&gt;alert(&#39;hi&#39;)&lt;/script&gt; &amp; &quot;quotes&quot;"
    );
  });

  it("neutralises an attempted script injection in a customer name", () => {
    const maliciousName = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(maliciousName);
    expect(escaped).not.toContain("<img");
    expect(escaped).toContain("&lt;img");
  });

  it("passes through plain text unchanged", () => {
    expect(escapeHtml("Rebecca Smith")).toBe("Rebecca Smith");
  });

  it("handles numbers and nullish values without throwing", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(null)).toBe("");
  });
});

describe("isSafeTrackingUrl", () => {
  it("accepts genuine http and https URLs", () => {
    expect(isSafeTrackingUrl("https://www.royalmail.com/track/ABC123")).toBe(true);
    expect(isSafeTrackingUrl("http://example.com/track")).toBe(true);
  });

  it("rejects a javascript: URL", () => {
    expect(isSafeTrackingUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects an empty or missing value", () => {
    expect(isSafeTrackingUrl("")).toBe(false);
    expect(isSafeTrackingUrl(undefined)).toBe(false);
  });

  it("rejects a value that isn't a valid URL at all", () => {
    expect(isSafeTrackingUrl("not a url")).toBe(false);
  });
});
