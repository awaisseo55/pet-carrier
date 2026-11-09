import { describe, it, expect } from "vitest";
import { parseTemuUrl, isTemuImageUrl } from "@/lib/temu-url";

const REAL_URL =
  "https://www.temu.com/uk/large--bag-portable-folding--travel-crate-cage-with-zipper-closure--interior-front-door-window-side-ventilation-mesh-lightweight-sturdy-for-airplane-car-vet--safe-comfortable-carrier-for-medium-dogs-cats-puppies-easy-fold-design-for-home-storage--for-small-dog-puppy-carrier-for-small-dog-dog-carrier-for-medium-dog-pet-backpack-lightw-backpack-dog-car-seat-for-medium-dog-pet-backpack-with-fan-dog-carrier-backpack-g-601103552427837.html" +
  "?_oak_mp_inf=EL3u3J211ogBGiBhMWY2ZTBiN2NmZjE0ZjM4ODJiYWRhOTg3NWMwMTc4OCCVr6yAnDQ%3D" +
  "&top_gallery_url=https%3A%2F%2Fimg.kwcdn.com%2Fproduct%2Ffancy%2F1d692b65-29e1-4137-bd55-f475b66512bd.jpg" +
  "&refer_page_sn=10009&_x_sessn_id=fx06be0tr4";

describe("parseTemuUrl", () => {
  it("pulls the goods ID out of the -g-<id>.html suffix", () => {
    expect(parseTemuUrl(REAL_URL)?.goodsId).toBe("601103552427837");
  });

  it("strips every query parameter, so session ids and referral tracking are never stored", () => {
    const canonical = parseTemuUrl(REAL_URL)!.canonicalUrl;
    expect(canonical).not.toContain("?");
    expect(canonical).not.toContain("_x_sessn_id");
    expect(canonical.endsWith("-g-601103552427837.html")).toBe(true);
  });

  it("recovers the main gallery image from top_gallery_url", () => {
    expect(parseTemuUrl(REAL_URL)?.galleryImage).toBe(
      "https://img.kwcdn.com/product/fancy/1d692b65-29e1-4137-bd55-f475b66512bd.jpg",
    );
  });

  it("turns the slug into readable keyword text and a bounded title seed", () => {
    const parsed = parseTemuUrl(REAL_URL)!;
    expect(parsed.keywordText).toContain("travel crate cage with zipper closure");
    expect(parsed.keywordText).not.toContain("-");
    // Capped near a normal title length: with no AI key this value is what
    // gets published, so it must not be the whole 400-char keyword string.
    expect(parsed.titleSeed.length).toBeLessThanOrEqual(70);
    expect(parsed.keywordText.length).toBeGreaterThan(300);
    // Trimmed at a word boundary, never mid-word.
    expect(parsed.titleSeed.endsWith(" ")).toBe(false);
  });

  it("ignores a gallery image that isn't on a Temu CDN", () => {
    const url = "https://www.temu.com/uk/thing-g-123456789.html?top_gallery_url=https%3A%2F%2Fevil.com%2Fx.jpg";
    expect(parseTemuUrl(url)?.galleryImage).toBeNull();
  });

  it("accepts a goods_id query parameter when the path has no -g- suffix", () => {
    expect(parseTemuUrl("https://www.temu.com/uk/some-listing.html?goods_id=601103552427837")?.goodsId).toBe(
      "601103552427837",
    );
  });

  it.each([
    ["a non-Temu host", "https://www.amazon.co.uk/dp/B0XXXXXXXX"],
    ["a Temu page with no goods ID", "https://www.temu.com/uk/some-page.html"],
    ["a look-alike host", "https://temu.com.evil.com/thing-g-123456789.html"],
    ["junk", "not a url"],
  ])("returns null for %s", (_label, url) => {
    expect(parseTemuUrl(url)).toBeNull();
  });
});

describe("isTemuImageUrl", () => {
  it.each([
    "https://img.kwcdn.com/product/fancy/a.jpg",
    "https://aimg.kwcdn.com/b.jpg",
    "https://www.temu.com/image.jpg",
  ])("accepts %s", (url) => {
    expect(isTemuImageUrl(url)).toBe(true);
  });

  it.each([
    ["plain http", "http://img.kwcdn.com/c.jpg"],
    ["an unrelated host", "https://evil.com/d.jpg"],
    // The import downloads these server-side, so a suffix-spoofed host must not slip through.
    ["a suffix-spoofed host", "https://img.kwcdn.com.evil.com/e.jpg"],
    ["junk", "nonsense"],
  ])("rejects %s", (_label, url) => {
    expect(isTemuImageUrl(url)).toBe(false);
  });
});
