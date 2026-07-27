"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { CategoryPicker } from "@/components/admin/category-picker";
import { toast } from "sonner";

const MAX_IMAGES = 8;

export function ManualProductForm({ initialAmazonUrl = "" }: { initialAmazonUrl?: string }) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [compareAtPrice, setCompareAtPrice] = React.useState("");
  const [sizeRange, setSizeRange] = React.useState("");
  const [weightCapacity, setWeightCapacity] = React.useState("");
  const [features, setFeatures] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [categorySlugs, setCategorySlugs] = React.useState<string[]>([]);
  const [amazonUrl, setAmazonUrl] = React.useState(initialAmazonUrl);
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const uploadSlug = title ? title : "new-product";

  async function handleSave() {
    if (!title || !description || !price || images.length === 0 || categorySlugs.length === 0) {
      toast.error("Fill in the title, description, price, at least one image and one category.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/products/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        short_description: shortDescription,
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        size_range: sizeRange,
        weight_capacity: weightCapacity,
        features: features.split("\n").filter(Boolean),
        images,
        category_slugs: categorySlugs,
        amazon_url: amazonUrl,
        is_active: isActive,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Product created", { description: "It will appear on the live site within a few seconds." });
      router.push("/admin/products");
    } else {
      const data = await res.json();
      toast.error(data.error || "Could not create product");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <Label>Images</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img + i} className="group relative size-24 overflow-hidden rounded-lg bg-gray-100">
              <Image src={img} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
        {images.length < MAX_IMAGES && (
          <div className="mt-3">
            <ImageUploadField
              type="product"
              slug={uploadSlug}
              label="Add image"
              refreshOnSuccess={false}
              onUploaded={(url) => setImages((prev) => [...prev, url])}
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Short description</Label>
            <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>Price (£)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Was price (£)</Label>
              <Input type="number" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Size range</Label>
              <Input value={sizeRange} onChange={(e) => setSizeRange(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Weight capacity</Label>
              <Input value={weightCapacity} onChange={(e) => setWeightCapacity(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Features (one per line)</Label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>Categories</Label>
            <CategoryPicker selected={categorySlugs} onChange={setCategorySlugs} />
          </div>
          <div>
            <Label>Amazon URL (for reordering)</Label>
            <Input
              value={amazonUrl}
              onChange={(e) => setAmazonUrl(e.target.value)}
              placeholder="https://www.amazon.co.uk/dp/..."
              className="mt-1.5"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(!!c)} />
            Publish immediately
          </label>
        </div>
      </div>

      <Button variant="default" size="lg" className="w-fit" onClick={handleSave} disabled={saving}>
        {saving ? "Creating..." : "Create Product"}
      </Button>
    </div>
  );
}
