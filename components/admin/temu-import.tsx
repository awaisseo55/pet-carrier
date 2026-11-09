"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryPicker } from "@/components/admin/category-picker";
import { parseTemuUrl } from "@/lib/temu-url";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { TemuFetchPreview } from "@/app/api/admin/temu/fetch/route";

/**
 * Paste-assisted Temu import. Temu product pages return an anti-bot challenge
 * to any server-side request, so unlike the Amazon tab there is no scrape:
 * the admin copies the price and gallery image URLs off the listing and
 * everything downstream (AI rewrite, slug, categories, image processing,
 * duplicate check) is the same pipeline. See lib/temu-url.ts.
 */

interface EditablePreview
  extends Required<
    Omit<TemuFetchPreview, "error" | "ok" | "duplicate" | "existing_product_id">
  > {
  ok: true;
  is_active: boolean;
  is_featured: boolean;
}

type ResultItem =
  | EditablePreview
  | { ok: false; amazon_url: string; error: string; duplicate?: boolean; existing_product_id?: string };

const textareaClass =
  "mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TemuImport() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [supplierPrice, setSupplierPrice] = React.useState("");
  const [imageUrlsText, setImageUrlsText] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [detailsText, setDetailsText] = React.useState("");
  const [fetching, setFetching] = React.useState(false);
  const [results, setResults] = React.useState<ResultItem[]>([]);
  const [saving, setSaving] = React.useState(false);

  // A URL copied from Temu search results carries the main gallery image in a
  // query param, so fill the image box with it as a head start.
  function handleUrlChange(value: string) {
    setUrl(value);
    const parsed = parseTemuUrl(value);
    if (parsed?.galleryImage && imageUrlsText.trim() === "") {
      setImageUrlsText(parsed.galleryImage);
    }
  }

  async function handleFetch() {
    if (!parseTemuUrl(url)) {
      toast.error("Paste a Temu product URL (a temu.com link ending in -g-<numbers>.html).");
      return;
    }
    if (!(Number(supplierPrice) > 0)) {
      toast.error("Enter the price shown on Temu.");
      return;
    }

    const image_urls = imageUrlsText.split("\n").map((u) => u.trim()).filter(Boolean);
    if (image_urls.length === 0) {
      toast.error("Add at least one image URL from the listing.");
      return;
    }

    setFetching(true);
    try {
      const res = await fetch("/api/admin/temu/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          supplier_price: Number(supplierPrice),
          image_urls,
          title: title.trim(),
          brand: brand.trim(),
          details: detailsText.split("\n").map((d) => d.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not prepare that listing.");
        return;
      }
      if (data.rejected_images > 0) {
        toast.warning(
          `${data.rejected_images} image link(s) were ignored because they aren't on a Temu CDN (img.kwcdn.com).`,
        );
      }
      setResults(
        data.results.map((r: TemuFetchPreview) => (r.ok ? { ...r, is_active: true, is_featured: false } : r)),
      );
    } catch {
      toast.error("Something went wrong preparing that listing.");
    } finally {
      setFetching(false);
    }
  }

  function updateResult(index: number, updates: Partial<EditablePreview>) {
    setResults((prev) => prev.map((r, i) => (i === index && r.ok ? { ...r, ...updates } : r)));
  }

  function recalcPrice(index: number, markup: number) {
    setResults((prev) =>
      prev.map((r, i) => {
        if (i !== index || !r.ok) return r;
        const base = r.amazon_price ?? 0;
        return { ...r, markup_percentage: markup, price: Math.round(base * (1 + markup / 100) * 100) / 100 };
      }),
    );
  }

  async function handleSaveAll() {
    const validResults = results.filter((r): r is EditablePreview => r.ok);
    if (validResults.length === 0) {
      toast.error("No valid products to save.");
      return;
    }
    if (validResults.some((r) => r.category_slugs.length === 0)) {
      toast.error("Choose at least one category before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: validResults }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save products.");
        return;
      }
      const duplicateUrls = new Set<string>((data.errors || []).map((e: { amazon_url: string }) => e.amazon_url));
      if (data.products.length > 0) toast.success(`Saved ${data.products.length} product(s)`);
      if (duplicateUrls.size > 0) {
        toast.error("That listing was already saved as an existing product.");
        setResults((prev) =>
          prev.map((r) =>
            r.ok && duplicateUrls.has(r.amazon_url)
              ? { ok: false, amazon_url: r.amazon_url, error: "Already saved as an existing product." }
              : r,
          ),
        );
        return;
      }
      router.push("/admin/products");
    } catch {
      toast.error("Something went wrong saving products.");
    } finally {
      setSaving(false);
    }
  }

  const validCount = results.filter((r) => r.ok).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="temu-url">Temu product URL</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Temu blocks automated page reads, so the price and images below have to be copied off the listing. Everything
              else is filled in for you.
            </p>
            <Input
              id="temu-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.temu.com/uk/...-g-601103552427837.html"
              className="mt-3"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="temu-price">Price on Temu (£)</Label>
              <Input
                id="temu-price"
                type="number"
                step="0.01"
                value={supplierPrice}
                onChange={(e) => setSupplierPrice(e.target.value)}
                placeholder="24.99"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="temu-brand">Brand (optional)</Label>
              <Input
                id="temu-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Leave blank if the listing has no real brand"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="temu-images">Image URLs (one per line)</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Right-click each gallery image on Temu and copy the image address. Only img.kwcdn.com links are accepted.
            </p>
            <textarea
              id="temu-images"
              value={imageUrlsText}
              onChange={(e) => setImageUrlsText(e.target.value)}
              rows={4}
              placeholder="https://img.kwcdn.com/product/fancy/..."
              className={textareaClass}
            />
          </div>

          <div>
            <Label htmlFor="temu-title">Listing title (optional)</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Improves the rewrite. Without it the keyword-stuffed title from the URL is used instead.
            </p>
            <Input
              id="temu-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="temu-details">Key details from the listing (optional, one per line)</Label>
            <textarea
              id="temu-details"
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              rows={4}
              placeholder={"Dimensions: 46 x 30 x 30cm\nFolds flat for storage\nMesh ventilation on three sides"}
              className={textareaClass}
            />
          </div>

          <Button variant="default" className="w-fit" onClick={handleFetch} disabled={fetching}>
            {fetching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {fetching ? "Rewriting with AI..." : "Fetch & Rewrite with AI"}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-6">
          {results.map((result, index) =>
            result.ok ? (
              <div key={result.amazon_url} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
                  <div className="flex gap-2 overflow-x-auto lg:flex-col">
                    {result.images.slice(0, 4).map((img, i) => (
                      <div
                        key={img + i}
                        className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 lg:size-full lg:aspect-square"
                      >
                        <Image src={img} alt="" fill sizes="220px" className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    {!result.ai_generated && (
                      <div className="flex items-start gap-3 rounded-lg border border-warning-light bg-warning-light/40 p-4">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">Not AI-rewritten</p>
                          <p className="mt-0.5 text-muted-foreground">
                            ANTHROPIC_API_KEY is unset or the call failed, so the copy below is lightly-tidied raw
                            listing text, not original writing. Rewrite the title and description before publishing.
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Product Title (SEO-rewritten)</Label>
                      <Input
                        value={result.title}
                        onChange={(e) => updateResult(index, { title: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>Short Description</Label>
                      <Input
                        value={result.short_description}
                        onChange={(e) => updateResult(index, { short_description: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <textarea
                        value={result.description}
                        onChange={(e) => updateResult(index, { description: e.target.value })}
                        rows={5}
                        className={textareaClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <Label>Temu price</Label>
                        <p className="mt-1.5 flex h-11 items-center text-sm text-muted-foreground">
                          {result.amazon_price ? formatPrice(result.amazon_price) : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <Label>Markup %</Label>
                        <Input
                          type="number"
                          value={result.markup_percentage}
                          onChange={(e) => recalcPrice(index, Number(e.target.value))}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Sale price (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={result.price}
                          onChange={(e) => updateResult(index, { price: Number(e.target.value) })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Was price (optional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={result.compare_at_price ?? ""}
                          onChange={(e) =>
                            updateResult(index, {
                              compare_at_price: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <Label>Brand</Label>
                        <Input
                          value={result.brand}
                          placeholder="Pet Carrier"
                          onChange={(e) => updateResult(index, { brand: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Size range</Label>
                        <Input
                          value={result.size_range}
                          placeholder="e.g. Medium"
                          onChange={(e) => updateResult(index, { size_range: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Weight capacity</Label>
                        <Input
                          value={result.weight_capacity}
                          placeholder="e.g. Up to 10 kg"
                          onChange={(e) => updateResult(index, { weight_capacity: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Categories</Label>
                      <p className="mt-0.5 mb-1.5 text-xs text-muted-foreground">
                        Pre-selected from the listing text, adjust as needed. Tag every category the product genuinely fits.
                      </p>
                      <CategoryPicker
                        selected={result.category_slugs}
                        onChange={(paths) => updateResult(index, { category_slugs: paths })}
                      />
                    </div>

                    <div>
                      <Label>Features (one per line)</Label>
                      <textarea
                        value={result.features.join("\n")}
                        onChange={(e) =>
                          updateResult(index, { features: e.target.value.split("\n").filter(Boolean) })
                        }
                        rows={4}
                        className={textareaClass}
                      />
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={result.is_active}
                          onCheckedChange={(checked) => updateResult(index, { is_active: !!checked })}
                        />
                        Publish immediately
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={result.is_featured}
                          onCheckedChange={(checked) => updateResult(index, { is_featured: !!checked })}
                        />
                        Feature on homepage
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={result.amazon_url}
                className="flex items-start gap-3 rounded-lg border border-alert-light bg-alert-light/40 p-5"
              >
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-alert" />
                <div>
                  <p className="font-medium text-foreground break-all">{result.amazon_url}</p>
                  <p className="mt-1 text-sm text-alert">{result.error}</p>
                  {result.duplicate && result.existing_product_id && (
                    <Link
                      href={`/admin/products/${result.existing_product_id}/edit`}
                      className="mt-1 inline-block text-sm font-medium text-forest-700 hover:underline"
                    >
                      Edit the existing product instead &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ),
          )}

          {validCount > 0 && (
            <Button variant="default" size="lg" onClick={handleSaveAll} disabled={saving} className="w-fit">
              {saving ? "Saving..." : `Save & Publish ${validCount} Product${validCount === 1 ? "" : "s"}`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
