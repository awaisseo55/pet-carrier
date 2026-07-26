"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { PET_TYPES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

const MAX_IMAGES = 8;

export function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [images, setImages] = React.useState<string[]>(product.images);
  const [form, setForm] = React.useState({
    title: product.title,
    short_description: product.short_description,
    description: product.description,
    price: product.price,
    compare_at_price: product.compare_at_price ?? undefined,
    category: product.category,
    size_range: product.size_range,
    weight_capacity: product.weight_capacity,
    stock_status: product.stock_status,
    features: product.features.join("\n"),
    is_active: product.is_active,
    is_featured: product.is_featured ?? false,
  });
  const [saving, setSaving] = React.useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        images,
        pet_type: form.category,
        compare_at_price: form.compare_at_price || null,
        features: form.features.split("\n").filter(Boolean),
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Product updated");
      router.push("/admin/products");
      router.refresh();
    } else {
      toast.error("Could not save changes");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto lg:flex-wrap">
            {images.map((img, i) => (
              <div
                key={img + i}
                className="group relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark"
              >
                <Image src={img} alt="" fill sizes="96px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-brown/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          {images.length < MAX_IMAGES ? (
            <ImageUploadField
              type="product"
              slug={product.amazon_asin}
              label="Add image"
              refreshOnSuccess={false}
              onUploaded={(url) => setImages((prev) => [...prev, url])}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Maximum of {MAX_IMAGES} images reached.</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Short description</Label>
            <Input
              value={form.short_description}
              onChange={(e) => update("short_description", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-input bg-cream px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <Label>Price (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => update("price", Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Was price (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.compare_at_price ?? ""}
                onChange={(e) => update("compare_at_price", e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Stock status</Label>
              <Select value={form.stock_status} onValueChange={(v) => update("stock_status", v as Product["stock_status"])}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In stock</SelectItem>
                  <SelectItem value="low_stock">Low stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v as Product["category"])}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size range</Label>
              <Input value={form.size_range} onChange={(e) => update("size_range", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Weight capacity</Label>
              <Input
                value={form.weight_capacity}
                onChange={(e) => update("weight_capacity", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Features (one per line)</Label>
            <textarea
              value={form.features}
              onChange={(e) => update("features", e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-input bg-cream px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.is_active} onCheckedChange={(c) => update("is_active", !!c)} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.is_featured} onCheckedChange={(c) => update("is_featured", !!c)} />
              Featured on homepage
            </label>
          </div>

          <Button variant="default" size="lg" className="w-fit" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
