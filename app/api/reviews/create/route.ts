import { NextResponse } from "next/server";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getProductBySlug } from "@/lib/products";
import { uploadImageBuffer } from "@/lib/image-store";
import { slugify } from "@/lib/utils";
import {
  containsSpamTerms,
  createReview,
  hashIp,
  isRateLimited,
  toPublicReview,
} from "@/lib/reviews";
import { revalidatePath } from "next/cache";

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const formData = await request.formData();

  // Honeypot: a real customer never fills this hidden field in. Bots
  // filling every field usually do. Return a normal-looking success so the
  // bot has no signal to adjust its behaviour, without actually saving
  // anything.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true, review: null });
  }

  const productSlug = String(formData.get("productSlug") || "").trim();
  const ratingRaw = formData.get("rating");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const isAnonymous = formData.get("isAnonymous") === "true";
  const authorNameRaw = String(formData.get("authorName") || "").trim();
  const authorEmail = String(formData.get("authorEmail") || "").trim();

  const product = productSlug ? await getProductBySlug(productSlug) : undefined;
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Please choose a star rating from 1 to 5." }, { status: 400 });
  }
  if (body.length < 10) {
    return NextResponse.json({ error: "Your review needs to be at least 10 characters." }, { status: 400 });
  }
  if (body.length > 2000) {
    return NextResponse.json({ error: "Your review is too long (2000 characters maximum)." }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: "Review title is too long (100 characters maximum)." }, { status: 400 });
  }
  if (!isAnonymous && authorNameRaw.length === 0) {
    return NextResponse.json({ error: "Please enter your name, or choose to post anonymously." }, { status: 400 });
  }
  if (authorNameRaw.length > 50) {
    return NextResponse.json({ error: "Name is too long (50 characters maximum)." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(authorEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `You can attach up to ${MAX_IMAGES} photos.` }, { status: 400 });
  }
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Photos must be JPG, PNG or WebP." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Each photo must be under 5MB." }, { status: 400 });
    }
  }

  const ip = getRequestIp(request);
  const ipHash = hashIp(ip);
  if (await isRateLimited(product.id, ipHash)) {
    return NextResponse.json(
      { error: "You can only leave one review per product per hour. Please try again shortly." },
      { status: 429 }
    );
  }

  const reviewId = nanoid(12);
  const images: string[] = [];
  try {
    for (let i = 0; i < files.length; i++) {
      const buffer = Buffer.from(await files[i].arrayBuffer());
      const processed = await sharp(buffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      const destRelative = `products/${slugify(productSlug)}/reviews/${reviewId}/image-${i + 1}.webp`;
      const url = await uploadImageBuffer(destRelative, processed);
      images.push(url);
    }
  } catch (error) {
    console.error("Review image processing failed", error);
    return NextResponse.json({ error: "Could not process one of your photos. Please try again." }, { status: 500 });
  }

  // Obvious spam terms route the review to the moderation queue instead of
  // hard-rejecting it, a genuine review can trip this on a false positive
  // (e.g. mentioning a website), so an admin gets the final call rather than
  // the customer's feedback being silently discarded.
  const looksLikeSpam = containsSpamTerms(`${title} ${body}`);

  const review = await createReview({
    id: reviewId,
    productId: product.id,
    productSlug: product.slug,
    rating,
    title: title || undefined,
    body,
    authorName: authorNameRaw,
    authorEmail,
    isAnonymous,
    images,
    status: looksLikeSpam ? "pending" : "approved",
    ipHash,
  });

  revalidatePath(`/product/${product.slug}`);

  return NextResponse.json({ ok: true, review: toPublicReview(review) });
}
