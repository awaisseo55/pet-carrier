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
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { AmazonFetchPreview } from "@/app/api/admin/amazon/fetch/route";

interface EditablePreview
  extends Required<
    Omit<AmazonFetchPreview, "error" | "ok" | "asin" | "amazon_price" | "duplicate" | "existing_product_id">
  > {
  ok: true;
  asin: string;
  amazon_price: number | null;
  is_active: boolean;
  is_featured: boolean;
}

type ResultItem =
  | EditablePreview
  | { ok: false; amazon_url: string; error: string; duplicate?: boolean; existing_product_id?: string };

export function AmazonImport() {
  const router = useRouter();
  const [urlsText, setUrlsText] = React.useState("");
  const [fetching, setFetching] = React.useState(false);
  const [results, setResults] = React.useState<ResultItem[]>([]);
  const [saving, setSaving] = React.useState(false);

  async function handleFetch() {
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      toast.error("Paste at least one Amazon URL first.");
      return;
    }

    setFetching(true);
    try {
      const res = await fetch("/api/admin/amazon/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not fetch product data.");
        return;
      }
      setResults(
        data.results.map((r: AmazonFetchPreview) =>
          r.ok ? { ...r, is_active: true, is_featured: false } : r
        )
      );
    } catch {
      toast.error("Something went wrong fetching product data.");
    } finally {
      setFetching(false);
    }
  }

  function updateResult(index: number, updates: Partial<EditablePreview>) {
    setResults((prev) =>
      prev.map((r, i) => (i === index && r.ok ? { ...r, ...updates } : r))
    );
  }

  function recalcPrice(index: number, markup: number) {
    setResults((prev) =>
      prev.map((r, i) => {
        if (i !== index || !r.ok) return r;
        const base = r.amazon_price ?? 0;
        const price = Math.round(base * (1 + markup / 100) * 100) / 100;
        return { ...r, markup_percentage: markup, price };
      })
    );
  }

  async function handleSaveAll() {
    const validResults = results.filter((r): r is EditablePreview => r.ok);
    if (validResults.length === 0) {
      toast.error("No valid products to save.");
      return;
    }
    if (validResults.some((r) => r.category_slugs.length === 0)) {
      toast.error("Choose at least one category for every product before saving.");
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
        toast.error(
          `${duplicateUrls.size} product(s) were skipped as duplicates of an existing product and were not saved.`
        );
        setResults((prev) =>
          prev.map((r) =>
            r.ok && duplicateUrls.has(r.amazon_url)
              ? {
                  ok: false,
                  amazon_url: r.amazon_url,
                  error: "Already saved as an existing product, could not save again.",
                }
              : r
          )
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
        <Label htmlFor="urls">Amazon UK product URL(s)</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste one URL, or multiple, one per line, to add several products at once.
        </p>
        <textarea
          id="urls"
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={4}
          placeholder={"https://www.amazon.co.uk/dp/B0XXXXXXXX\nhttps://www.amazon.co.uk/dp/B0YYYYYYYY"}
          className="mt-3 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button variant="default" className="mt-4" onClick={handleFetch} disabled={fetching}>
          {fetching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {fetching ? "Fetching product data..." : "Fetch Product Data"}
        </Button>
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
                        className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <Label>Amazon price</Label>
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Size range</Label>
                        <Input
                          value={result.size_range}
                          placeholder="e.g. Small"
                          onChange={(e) => updateResult(index, { size_range: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Weight capacity</Label>
                        <Input
                          value={result.weight_capacity}
                          placeholder="e.g. Up to 7 kg"
                          onChange={(e) => updateResult(index, { weight_capacity: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Categories</Label>
                      <p className="mt-0.5 mb-1.5 text-xs text-muted-foreground">
                        Pre-selected based on the product title, adjust as needed. A product can belong to several
                        categories.
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
                        className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <p className="font-medium text-foreground">{result.amazon_url}</p>
                  <p className="mt-1 text-sm text-alert">{result.error}</p>
                  {result.duplicate && result.existing_product_id ? (
                    <Link
                      href={`/admin/products/${result.existing_product_id}/edit`}
                      className="mt-1 inline-block text-sm font-medium text-blue-700 hover:underline"
                    >
                      Edit the existing product instead &rarr;
                    </Link>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      You can add this product manually from the Products page instead.
                    </p>
                  )}
                </div>
              </div>
            )
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
