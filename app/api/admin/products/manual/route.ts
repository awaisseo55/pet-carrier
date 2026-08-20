import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { findProductByAmazonUrl, getAllProducts, upsertProduct } from "@/lib/products";
import { slugify } from "@/lib/utils";
import { nanoid } from "nanoid";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateProductPaths } from "@/lib/revalidate";
import type { Product } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, short_description, price, images, category_slugs } = body;

  if (!title || !description || !price || !images?.length || !category_slugs?.length) {
    return NextResponse.json(
      { error: "Title, description, price, at least one image and one category are required." },
      { status: 400 }
    );
  }

  if (body.amazon_url) {
    const duplicate = await findProductByAmazonUrl(body.amazon_url);
    if (duplicate) {
      return NextResponse.json(
        {
          error: `A product from this Amazon listing already exists: "${duplicate.title}".`,
          existingProductId: duplicate.id,
        },
        { status: 409 }
      );
    }
  }

  const products = await getAllProducts();
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;
  while (products.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const id = `PC-${nanoid(8).toUpperCase()}`;
  const now = new Date().toISOString();

  const product: Product = {
    id,
    slug,
    title,
    description,
    short_description: short_description || description.slice(0, 160),
    features: body.features || [],
    specifications: body.specifications || {},
    price: Number(price),
    compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : null,
    sku: `PC-${id}`,
    stock_status: body.stock_status || "in_stock",
    stock_count: body.stock_count ?? 20,
    images,
    category_slugs,
    size_range: body.size_range || "Standard",
    weight_capacity: body.weight_capacity || "See listing",
    brand: "Pet Carrier",
    amazon_asin: "",
    amazon_url: body.amazon_url || "",
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    created_at: now,
    updated_at: now,
    markup_percentage: 0,
    meta_title: body.meta_title || title,
    meta_description: body.meta_description || short_description || "",
  };

  try {
    await upsertProduct(product);
    await revalidateProductPaths(product);
  } catch (error) {
    return adminErrorResponse(error, "Could not save product.");
  }

  return NextResponse.json({ product });
}
