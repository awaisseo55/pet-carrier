import { describe, it, expect, vi } from "vitest";
import type { Product } from "@/lib/types";

vi.mock("resend", () => ({ Resend: vi.fn() }));

const { buildMerchantFeedXml } = await import("@/lib/merchant-feed");

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "test-carrier",
    title: "Test Carrier",
    description: "Long description",
    short_description: "A comfy carrier",
    features: [],
    specifications: {},
    price: 59.99,
    compare_at_price: null,
    sku: "PC-TEST1",
    stock_status: "in_stock",
    images: ["https://images.pet-carrier.co.uk/test.webp"],
    category_slugs: ["carriers/dog-carriers"],
    size_range: "",
    weight_capacity: "",
    brand: "Feandrea",
    amazon_asin: "B000TEST1",
    amazon_url: "https://amazon.co.uk/dp/B000TEST1",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    markup_percentage: 40,
    ...overrides,
  };
}

describe("buildMerchantFeedXml", () => {
  it("escapes a title containing XML-special characters", () => {
    const product = baseProduct({ title: `Carrier & "Case" <Large>` });
    const xml = buildMerchantFeedXml([product], new Map());
    expect(xml).toContain("Carrier &amp; &quot;Case&quot; &lt;Large&gt;");
    expect(xml).not.toContain("<Large>");
  });

  it("marks identifier_exists as no, never fabricating a GTIN", () => {
    const xml = buildMerchantFeedXml([baseProduct()], new Map());
    expect(xml).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(xml).not.toContain("<g:gtin>");
  });

  it("maps out_of_stock and in_stock/low_stock correctly", () => {
    const outOfStock = buildMerchantFeedXml([baseProduct({ id: "p2", stock_status: "out_of_stock" })], new Map());
    expect(outOfStock).toContain("<g:availability>out_of_stock</g:availability>");

    const lowStock = buildMerchantFeedXml([baseProduct({ id: "p3", stock_status: "low_stock" })], new Map());
    expect(lowStock).toContain("<g:availability>in_stock</g:availability>");
  });

  it("skips a product with no images entirely, Google requires image_link", () => {
    const xml = buildMerchantFeedXml([baseProduct({ images: [] })], new Map());
    expect(xml).not.toContain("<item>");
  });

  it("emits one item per variant, linked by item_group_id, instead of the base product", () => {
    const product = baseProduct({
      hasVariants: true,
      variants: [
        { id: "v1", type: "size", sizeLabel: "Small", price: 49.99, sku: "PC-TEST1-S", inStock: true },
        { id: "v2", type: "size", sizeLabel: "Large", price: 69.99, sku: "PC-TEST1-L", inStock: false },
      ],
    });
    const xml = buildMerchantFeedXml([product], new Map());
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml).toContain("<g:id>PC-TEST1-S</g:id>");
    expect(xml).toContain("<g:id>PC-TEST1-L</g:id>");
    expect(xml).toContain("<g:item_group_id>PC-TEST1</g:item_group_id>");
    expect(xml).toContain("Test Carrier - Small");
    expect(xml).toContain("<g:price>69.99 GBP</g:price>");
    expect(xml).toContain("<g:availability>out_of_stock</g:availability>");
  });

  it("includes resolved category names as product_type", () => {
    const product = baseProduct({ category_slugs: ["carriers/dog-carriers"] });
    const xml = buildMerchantFeedXml([product], new Map([["carriers/dog-carriers", "Dog Carriers"]]));
    expect(xml).toContain("<g:product_type>Dog Carriers</g:product_type>");
  });
});
