import { NextResponse } from "next/server";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { categoryUploadSlug } from "@/lib/placeholders";
import { uploadImageBuffer } from "@/lib/image-store";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadType = "category" | "hero" | "blog" | "product";

// Dimensions per the spec: category 1600x900, hero 2000x1200, blog
// 1200x630, product 1200x1200 (thumbnails are generated on the fly by
// next/image's optimizer, so we only store the one main size here).
const RESIZE_CONFIG: Record<UploadType, { width: number; height: number }> = {
  category: { width: 1600, height: 900 },
  hero: { width: 2000, height: 1200 },
  blog: { width: 1200, height: 630 },
  product: { width: 1200, height: 1200 },
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type") as UploadType | null;
  const slug = formData.get("slug") as string | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!type || !RESIZE_CONFIG[type]) {
    return NextResponse.json({ error: "Invalid upload type." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG or WebP image." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Images must be under 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { width, height } = RESIZE_CONFIG[type];

  let destRelative: string;
  if (type === "category") {
    if (!slug) return NextResponse.json({ error: "Missing category path." }, { status: 400 });
    destRelative = `uploads/category/${categoryUploadSlug(slug)}.webp`;
  } else if (type === "hero") {
    destRelative = "uploads/hero/main-hero.webp";
  } else if (type === "blog") {
    if (!slug) return NextResponse.json({ error: "Missing post slug." }, { status: 400 });
    destRelative = `uploads/blog/${slugify(slug)}.webp`;
  } else {
    if (!slug) return NextResponse.json({ error: "Missing product identifier." }, { status: 400 });
    destRelative = `uploads/product/${slugify(slug)}/upload-${Date.now()}.webp`;
  }

  let url: string;
  try {
    const processed = await sharp(buffer).resize(width, height, { fit: "cover" }).webp({ quality: 88 }).toBuffer();
    url = await uploadImageBuffer(destRelative, processed);
  } catch (error) {
    console.error("Image processing failed", error);
    return NextResponse.json({ error: "Could not process that image." }, { status: 500 });
  }

  return NextResponse.json({ url: `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` });
}
