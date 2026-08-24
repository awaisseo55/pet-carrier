import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Product, Review } from "@/lib/types";

let fakeProducts: Product[] = [];
let fakeReviews: Review[] = [];

vi.mock("@/lib/data-store", () => ({
  readJsonFile: vi.fn(async (file: string) => {
    if (file === "products.json") return fakeProducts;
    if (file === "reviews.json") return fakeReviews;
    return [];
  }),
  writeJsonFile: vi.fn(async (file: string, data: unknown) => {
    if (file === "products.json") fakeProducts = data as Product[];
    if (file === "reviews.json") fakeReviews = data as Review[];
  }),
}));

const { processReviewCsvRow } = await import("@/lib/review-csv-import");

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  return {
    id: "PC-AAAA1111",
    slug: "soft-sided-cat-carrier",
    title: "Soft-Sided Cat Carrier",
    description: "A carrier.",
    short_description: "A carrier.",
    features: [],
    specifications: {},
    price: 29.99,
    compare_at_price: null,
    sku: "PC-B0EXAMPLE1",
    stock_status: "in_stock",
    images: ["https://images.pet-carrier.co.uk/x.webp"],
    category_slugs: ["carriers/cat-carriers"],
    size_range: "Standard",
    weight_capacity: "Up to 8kg",
    brand: "Pet Carrier",
    amazon_asin: "B0EXAMPLE1",
    amazon_url: "https://www.amazon.co.uk/dp/B0EXAMPLE1",
    is_active: true,
    created_at: now,
    updated_at: now,
    markup_percentage: 30,
    ...overrides,
  };
}

function makeRow(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  return {
    product_match: "soft-sided-cat-carrier",
    rating: "5",
    body: "Great carrier, my cat settled in quickly.",
    title: "",
    author_name: "",
    author_email: "",
    created_at: "",
    ...overrides,
  } as Record<string, string>;
}

beforeEach(() => {
  fakeProducts = [makeProduct(), makeProduct({ id: "PC-BBBB2222", slug: "hard-shell-dog-crate", sku: "PC-B0EXAMPLE2", amazon_asin: "B0EXAMPLE2", amazon_url: "https://www.amazon.co.uk/dp/B0EXAMPLE2" })];
  fakeReviews = [];
});

describe("processReviewCsvRow product matching", () => {
  it("matches an existing product by exact slug", async () => {
    const result = await processReviewCsvRow(1, makeRow({ product_match: "soft-sided-cat-carrier" }));
    expect(result.ok).toBe(true);
    expect(result.review?.productId).toBe("PC-AAAA1111");
    expect(result.review?.productSlug).toBe("soft-sided-cat-carrier");
  });

  it("matches an existing product by exact ASIN", async () => {
    const result = await processReviewCsvRow(1, makeRow({ product_match: "B0EXAMPLE2" }));
    expect(result.ok).toBe(true);
    expect(result.review?.productId).toBe("PC-BBBB2222");
  });

  it("matches an existing product by exact internal product id", async () => {
    const result = await processReviewCsvRow(1, makeRow({ product_match: "PC-AAAA1111" }));
    expect(result.ok).toBe(true);
    expect(result.review?.productId).toBe("PC-AAAA1111");
  });

  it("never assigns a review to a different product on a near-miss slug, it fails the row instead", async () => {
    const result = await processReviewCsvRow(1, makeRow({ product_match: "soft-sided-cat-carrie" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no product found/i);
    expect(fakeReviews).toHaveLength(0);
  });

  it("never guesses from a partial title match, only exact slug/id/ASIN are tried", async () => {
    const result = await processReviewCsvRow(1, makeRow({ product_match: "Soft-Sided Cat Carrier" }));
    expect(result.ok).toBe(false);
    expect(fakeReviews).toHaveLength(0);
  });

  it("rejects a missing product reference rather than defaulting to any product", async () => {
    const result = await processReviewCsvRow(1, makeRow({ product_match: "" }));
    expect(result.ok).toBe(false);
    expect(fakeReviews).toHaveLength(0);
  });
});

describe("processReviewCsvRow validation and defaults", () => {
  it("rejects an out-of-range rating", async () => {
    const result = await processReviewCsvRow(1, makeRow({ rating: "6" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/rating/i);
  });

  it("rejects empty review text", async () => {
    const result = await processReviewCsvRow(1, makeRow({ body: "" }));
    expect(result.ok).toBe(false);
  });

  it("marks the review anonymous with authorName 'Anonymous' when no reviewer name is given", async () => {
    const result = await processReviewCsvRow(1, makeRow({ author_name: "" }));
    expect(result.ok).toBe(true);
    expect(result.review?.isAnonymous).toBe(true);
    expect(result.review?.authorName).toBe("Anonymous");
  });

  it("uses the supplied reviewer name and marks the review as not anonymous", async () => {
    const result = await processReviewCsvRow(1, makeRow({ author_name: "Priya K" }));
    expect(result.ok).toBe(true);
    expect(result.review?.isAnonymous).toBe(false);
    expect(result.review?.authorName).toBe("Priya K");
  });

  it("carries an explicit review date through instead of stamping today", async () => {
    const result = await processReviewCsvRow(1, makeRow({ created_at: "2025-06-01" }));
    expect(result.ok).toBe(true);
    expect(result.review?.createdAt).toBe(new Date("2025-06-01").toISOString());
  });

  it("rejects an unparseable date rather than silently falling back to today", async () => {
    const result = await processReviewCsvRow(1, makeRow({ created_at: "not-a-date" }));
    expect(result.ok).toBe(false);
    expect(fakeReviews).toHaveLength(0);
  });

  it("never lets the CSV change verified status or approval status: imported reviews get the exact same defaults as any other review", async () => {
    const result = await processReviewCsvRow(1, makeRow());
    expect(result.ok).toBe(true);
    expect(result.review?.isVerified).toBe(true);
    expect(result.review?.status).toBe("approved");
  });
});
