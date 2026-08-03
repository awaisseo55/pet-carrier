import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { extractAsin, scrapeAmazonProduct } from "@/lib/amazon";
import { generateProductContent } from "@/lib/ai-content";
import { getSettings } from "@/lib/settings";
import { calculatePriceFromMarkup, findProductByAsin, getAllProducts } from "@/lib/products";
import { slugify } from "@/lib/utils";

export interface AmazonFetchPreview {
  ok: boolean;
  asin?: string;
  amazon_url: string;
  error?: string;
  duplicate?: boolean;
  existing_product_id?: string;
  title?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  meta_title?: string;
  meta_description?: string;
  features?: string[];
  images?: string[];
  amazon_price?: number | null;
  price?: number;
  compare_at_price?: number | null;
  markup_percentage?: number;
  category_slugs?: string[];
  size_range?: string;
  weight_capacity?: string;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { urls }: { urls: string[] } = await request.json();
  if (!urls || urls.length === 0) {
    return NextResponse.json({ error: "Please provide at least one Amazon URL." }, { status: 400 });
  }

  const [settings, existingProducts] = await Promise.all([getSettings(), getAllProducts()]);
  const existingSlugs = new Set(existingProducts.map((p) => p.slug));

  const results: AmazonFetchPreview[] = [];

  for (const rawUrl of urls) {
    const url = rawUrl.trim();
    if (!url) continue;

    const asin = extractAsin(url);
    if (asin) {
      const duplicate = await findProductByAsin(asin);
      if (duplicate) {
        results.push({
          ok: false,
          amazon_url: url,
          error: `A product from this Amazon listing already exists: "${duplicate.title}".`,
          duplicate: true,
          existing_product_id: duplicate.id,
        });
        continue;
      }
    }

    try {
      const scraped = await scrapeAmazonProduct(url);
      const content = await generateProductContent(scraped);

      let slug = slugify(content.title);
      let suffix = 2;
      while (existingSlugs.has(slug)) {
        slug = `${slugify(content.title)}-${suffix}`;
        suffix += 1;
      }
      existingSlugs.add(slug);

      const basePrice = scraped.price ?? 0;
      const price = calculatePriceFromMarkup(basePrice, settings.default_markup_percentage);

      results.push({
        ok: true,
        asin: scraped.asin,
        amazon_url: url,
        title: content.title,
        slug,
        description: content.description,
        short_description: content.short_description,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        features: content.features,
        images: scraped.images,
        amazon_price: scraped.price,
        price,
        compare_at_price: null,
        markup_percentage: settings.default_markup_percentage,
        category_slugs: content.suggested_category_slugs,
        size_range: "",
        weight_capacity: "",
      });
    } catch (error) {
      results.push({
        ok: false,
        amazon_url: url,
        error: error instanceof Error ? error.message : "Something went wrong fetching that URL.",
      });
    }
  }

  return NextResponse.json({ results });
}
