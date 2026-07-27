import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProductById } from "@/lib/products";
import { downloadAndProcessProductImageSet } from "@/lib/image-pipeline";

/**
 * Downloads a single externally-hosted image (typically an Amazon product
 * photo URL pasted in by the admin once automatic fetching has failed) and
 * stores it under /public/uploads/product/[id]/, per docs/PRODUCT-WORKFLOW.md
 * section 3. Returns the local main-image path to append to Product.images.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { url }: { url?: string } = await request.json();
  if (!url || !url.trim()) {
    return NextResponse.json({ error: "Please paste an image URL." }, { status: 400 });
  }

  const [result] = await downloadAndProcessProductImageSet(id, [url.trim()], existing.images.length);
  if (!result) {
    return NextResponse.json(
      { error: "Could not download that image. Check the URL points directly to a photo, then try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: result.main });
}
