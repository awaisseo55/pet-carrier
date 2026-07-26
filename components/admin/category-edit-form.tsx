"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { ResolvedCategory } from "@/lib/category-store";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function CategoryEditForm({
  categoryPath,
  resolved,
  imageUrl,
  isCustomImage,
  products,
}: {
  categoryPath: string;
  resolved: ResolvedCategory;
  imageUrl: string;
  isCustomImage: boolean;
  products: Product[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState(resolved.name);
  const [intro, setIntro] = React.useState(resolved.intro);
  const [whyChoose, setWhyChoose] = React.useState(resolved.whyChoose);
  const [sizingGuide, setSizingGuide] = React.useState(resolved.sizingGuide);
  const [metaTitle, setMetaTitle] = React.useState(resolved.metaTitle);
  const [metaDescription, setMetaDescription] = React.useState(resolved.metaDescription);
  const [faqs, setFaqs] = React.useState(resolved.faqs);
  const [featuredIds, setFeaturedIds] = React.useState<string[]>(resolved.featuredProductIds);
  const [saving, setSaving] = React.useState(false);

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }

  function toggleFeatured(id: string) {
    setFeaturedIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${categoryPath}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        intro,
        why_choose: whyChoose,
        sizing_guide: sizingGuide,
        meta_title: metaTitle,
        meta_description: metaDescription,
        faqs: faqs.filter((f) => f.question && f.answer),
        featured_product_ids: featuredIds,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Category updated");
      router.push("/admin/categories");
      router.refresh();
    } else {
      toast.error("Could not save changes");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <ImageUploadField
          type="category"
          slug={categoryPath}
          currentUrl={imageUrl}
          isCustom={isCustomImage}
          label="Category image"
          aspect="aspect-video"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Name (H1)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Meta title</Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1.5" />
              <p className="mt-1 text-xs text-gray-400">{metaTitle.length} / 60 characters</p>
            </div>
            <div>
              <Label>Meta description</Label>
              <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="mt-1.5" />
              <p className="mt-1 text-xs text-gray-400">{metaDescription.length} / 155 characters</p>
            </div>
          </div>
          <div>
            <Label>Intro copy</Label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>Why choose this category</Label>
            <textarea
              value={whyChoose}
              onChange={(e) => setWhyChoose(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>Sizing and buying guide</Label>
            <textarea
              value={sizingGuide}
              onChange={(e) => setSizingGuide(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <Label>FAQs</Label>
          <Button type="button" size="sm" variant="outline" onClick={addFaq}>
            <Plus className="size-3.5" />
            Add FAQ
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(index, "question", e.target.value)}
                  placeholder="Question"
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeFaq(index)}>
                  <Trash2 className="size-4 text-alert" />
                </Button>
              </div>
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(index, "answer", e.target.value)}
                placeholder="Answer"
                rows={2}
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <Label>Featured products</Label>
        <p className="mt-0.5 mb-2 text-xs text-gray-500">Shown first in this category’s product grid.</p>
        <div className="flex flex-col gap-1.5">
          {products.map((product) => (
            <label key={product.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={featuredIds.includes(product.id)} onCheckedChange={() => toggleFeatured(product.id)} />
              {product.title}
            </label>
          ))}
          {products.length === 0 && <p className="text-sm text-gray-400">No products yet.</p>}
        </div>
      </div>

      <Button variant="default" size="lg" className="w-fit" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
