import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateProductContent } from "@/lib/ai-content";
import { getSettings } from "@/lib/settings";
import { calculatePriceFromMarkup, findProductByAsin, getAllProducts } from "@/lib/products";
import { parseTemuUrl, isTemuImageUrl } from "@/lib/temu-url";
import { slugify } from "@/lib/utils";

/**
 * Temu counterpart to /api/admin/amazon/fetch. Temu product pages cannot be
 * scraped (every server-side request gets an anti-bot challenge, see
 * lib/temu-url.ts), so this route takes the listing details the admin copied
 * off the page and does everything else the Amazon import does: AI rewrite,
 * unique slug, suggested categories, markup pricing, duplicate check.
 *
 * The returned shape deliberately matches AmazonFetchPreview so both imports
 * can POST to the same /api/admin/products save route.
 */
export interface TemuFetchPreview {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
  existing_product_id?: string;
  /** Temu's goods ID, stored in Product.amazon_asin the way an ASIN is. */
  asin?: string;
  /** Canonical Temu URL (tracking and session params stripped), stored in Product.amazon_url. */
  amazon_url: string;
  source?: "temu";
  /** False when Claude was unavailable and the copy is lightly-tidied raw listing text. The form warns before publishing. */
  ai_generated?: boolean;
  title?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  meta_title?: string;
  meta_description?: string;
  features?: string[];
  images?: string[];
  brand?: string;
  amazon_price?: number | null;
  price?: number;
  compare_at_price?: number | null;
  markup_percentage?: number;
  category_slugs?: string[];
  size_range?: string;
  weight_capacity?: string;
}

export interface TemuFetchInput {
  url: string;
  /** Price on Temu in £, the basis for the marked-up sale price. */
  supplier_price: number;
  /** Gallery image URLs copied from the listing. Must be on a Temu CDN host. */
  image_urls: string[];
  /** The real listing title. Optional: falls back to the keyword-stuffed URL slug. */
  title?: string;
  /** Real manufacturer brand if the listing names one. */
  brand?: string;
  /** Key details copied off the listing, one per line, used as the rewrite's raw bullets. */
  details?: string[];
}

function fail(amazon_url: string, error: string): TemuFetchPreview {
  return { ok: false, amazon_url, error };
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input: TemuFetchInput = await request.json();
  const rawUrl = (input.url || "").trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "Please provide a Temu product URL." }, { status: 400 });
  }

  const parsed = parseTemuUrl(rawUrl);
  if (!parsed) {
    return NextResponse.json(
      {
        results: [
          fail(
            rawUrl,
            "That doesn't look like a Temu product URL. It should be a temu.com link ending in \"-g-<numbers>.html\".",
          ),
        ],
      },
      { status: 200 },
    );
  }

  const duplicate = await findProductByAsin(parsed.goodsId);
  if (duplicate) {
    return NextResponse.json({
      results: [
        {
          ok: false,
          amazon_url: parsed.canonicalUrl,
          error: `A product from this Temu listing already exists: "${duplicate.title}".`,
          duplicate: true,
          existing_product_id: duplicate.id,
        },
      ],
    });
  }

  const supplierPrice = Number(input.supplier_price);
  if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) {
    return NextResponse.json(
      { results: [fail(parsed.canonicalUrl, "Enter the price shown on Temu so the sale price can be calculated.")] },
      { status: 200 },
    );
  }

  // The gallery image embedded in a search-result URL is a free extra, the
  // admin's pasted list is the real source.
  const candidateImages = [...(input.image_urls || []), ...(parsed.galleryImage ? [parsed.galleryImage] : [])]
    .map((u) => u.trim())
    .filter(Boolean);

  const uniqueImages = [...new Set(candidateImages)];
  const images = uniqueImages.filter(isTemuImageUrl);
  /** Pasted links that weren't on a Temu CDN host, reported back so a typo doesn't silently vanish. */
  const rejected = uniqueImages.length - images.length;

  if (images.length === 0) {
    return NextResponse.json(
      {
        results: [
          fail(
            parsed.canonicalUrl,
            "Add at least one image URL from the listing (right-click the gallery image on Temu and copy the image address). Only Temu CDN links are accepted.",
          ),
        ],
      },
      { status: 200 },
    );
  }

  try {
    const [settings, existingProducts] = await Promise.all([getSettings(), getAllProducts()]);
    const existingSlugs = new Set(existingProducts.map((p) => p.slug));

    const rawTitle = (input.title || "").trim() || parsed.titleSeed;
    const details = (input.details || []).map((d) => d.trim()).filter(Boolean);

    const content = await generateProductContent({
      title: rawTitle,
      price: supplierPrice,
      images,
      bullets: details,
      // The keyword-stuffed slug is poor prose but genuinely describes the
      // product, so it's useful context for the rewrite and for category
      // suggestions when the admin hasn't pasted any details.
      description: parsed.keywordText,
    });

    let slug = slugify(content.title);
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${slugify(content.title)}-${suffix}`;
      suffix += 1;
    }

    const result: TemuFetchPreview = {
      ok: true,
      asin: parsed.goodsId,
      amazon_url: parsed.canonicalUrl,
      source: "temu",
      ai_generated: content.ai_generated,
      title: content.title,
      slug,
      description: content.description,
      short_description: content.short_description,
      meta_title: content.meta_title,
      meta_description: content.meta_description,
      features: content.features,
      images,
      brand: (input.brand || "").trim(),
      amazon_price: supplierPrice,
      price: calculatePriceFromMarkup(supplierPrice, settings.default_markup_percentage),
      compare_at_price: null,
      markup_percentage: settings.default_markup_percentage,
      category_slugs: content.suggested_category_slugs,
      size_range: "",
      weight_capacity: "",
    };

    return NextResponse.json({ results: [result], rejected_images: rejected });
  } catch (error) {
    return NextResponse.json({
      results: [
        fail(
          parsed.canonicalUrl,
          error instanceof Error ? error.message : "Something went wrong preparing that listing.",
        ),
      ],
    });
  }
}
