import { describe, it, expect } from "vitest";
import { validateContactForm } from "@/lib/contact-validation";

describe("validateContactForm", () => {
  it("accepts a well-formed submission", () => {
    const result = validateContactForm({
      name: "Rebecca",
      email: "rebecca@example.com",
      message: "Hello, I have a question about delivery times.",
    });
    expect(result.valid).toBe(true);
    expect(result.data?.email).toBe("rebecca@example.com");
  });

  it("rejects missing fields", () => {
    expect(validateContactForm({ name: "", email: "a@b.com", message: "hello there" }).valid).toBe(false);
    expect(validateContactForm({ name: "A", email: "", message: "hello there" }).valid).toBe(false);
    expect(validateContactForm({ name: "A", email: "a@b.com", message: "" }).valid).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = validateContactForm({ name: "A", email: "not-an-email", message: "hello there now" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/valid email/i);
  });

  it("rejects an overly long name", () => {
    const result = validateContactForm({
      name: "A".repeat(101),
      email: "a@b.com",
      message: "hello there now",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a message that's too short to be useful", () => {
    const result = validateContactForm({ name: "A", email: "a@b.com", message: "hi" });
    expect(result.valid).toBe(false);
  });

  it("rejects an excessively long message", () => {
    const result = validateContactForm({
      name: "A",
      email: "a@b.com",
      message: "x".repeat(5001),
    });
    expect(result.valid).toBe(false);
  });

  it("trims whitespace and lowercases the email", () => {
    const result = validateContactForm({
      name: "  Rebecca  ",
      email: "  Rebecca@Example.com  ",
      message: "  Hello, this has surrounding whitespace.  ",
    });
    expect(result.data?.name).toBe("Rebecca");
    expect(result.data?.email).toBe("rebecca@example.com");
  });
});
