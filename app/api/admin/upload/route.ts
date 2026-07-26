import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadType = "category" | "hero" | "blog" | "product";

const RESIZE_CONFIG: Record<UploadType, { width: number; height: number }> = {
  category: { width: 800, height: 800 },
  hero: { width: 1600, height: 1200 },
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
    if (!slug) return NextResponse.json({ error: "Missing category slug." }, { status: 400 });
    destRelative = `categories/${slugify(slug)}.webp`;
  } else if (type === "hero") {
    destRelative = "hero/main-hero.webp";
  } else if (type === "blog") {
    if (!slug) return NextResponse.json({ error: "Missing post slug." }, { status: 400 });
    destRelative = `blog/${slugify(slug)}.webp`;
  } else {
    if (!slug) return NextResponse.json({ error: "Missing product identifier." }, { status: 400 });
    destRelative = `products/${slugify(slug)}/upload-${Date.now()}.webp`;
  }

  const destPath = path.join(process.cwd(), "public", destRelative);
  await fs.mkdir(path.dirname(destPath), { recursive: true });

  try {
    await sharp(buffer).resize(width, height, { fit: "cover" }).webp({ quality: 88 }).toFile(destPath);
  } catch (error) {
    console.error("Image processing failed", error);
    return NextResponse.json({ error: "Could not process that image." }, { status: 500 });
  }

  return NextResponse.json({ url: `/${destRelative}?v=${Date.now()}` });
}
