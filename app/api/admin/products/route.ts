import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { upsertProduct } from "@/lib/products";
import { downloadAndProcessImages } from "@/lib/image-pipeline";
import type { Product } from "@/lib/types";

interface SaveProductInput {
  asin: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  meta_title: string;
  meta_description: string;
  features: string[];
  images: string[];
  price: number;
  compare_at_price?: number | null;
  markup_percentage: number;
  category: Product["category"];
  size_range: string;
  weight_capacity: string;
  amazon_url: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { products }: { products: SaveProductInput[] } = await request.json();
  if (!products || products.length === 0) {
    return NextResponse.json({ error: "No products to save." }, { status: 400 });
  }

  const saved: Product[] = [];

  for (const input of products) {
    // Images may already be local (re-saving an edited product) or remote
    // Amazon URLs from the fetch preview step, which we download here.
    const remoteImages = input.images.filter((img) => img.startsWith("http"));
    const localImages = input.images.filter((img) => !img.startsWith("http"));

    let downloaded: string[] = [];
    if (remoteImages.length > 0) {
      downloaded = await downloadAndProcessImages(input.asin, remoteImages);
    }

    const images = [...localImages, ...downloaded];
    if (images.length === 0) {
      return NextResponse.json(
        { error: `Could not download any images for "${input.title}". Please try again.` },
        { status: 502 }
      );
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: input.asin,
      slug: input.slug,
      title: input.title,
      description: input.description,
      short_description: input.short_description,
      features: input.features,
      specifications: {},
      price: input.price,
      compare_at_price: input.compare_at_price || null,
      sku: `PC-${input.asin}`,
      stock_status: "in_stock",
      stock_count: 20,
      images,
      category: input.category,
      pet_type: input.category,
      size_range: input.size_range || "Standard",
      weight_capacity: input.weight_capacity || "See listing",
      brand: "Pet Carrier",
      amazon_asin: input.asin,
      amazon_url: input.amazon_url,
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      created_at: now,
      updated_at: now,
      markup_percentage: input.markup_percentage,
      meta_title: input.meta_title,
      meta_description: input.meta_description,
    };

    await upsertProduct(product);
    saved.push(product);
  }

  return NextResponse.json({ products: saved });
}
