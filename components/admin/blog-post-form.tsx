"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

export function BlogPostForm() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("Pet Care");
  const [readTime, setReadTime] = React.useState("3 min read");
  const [coverImage, setCoverImage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const slug = slugify(title);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coverImage) {
      toast.error("Please upload a featured image before publishing.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        excerpt,
        content,
        cover_image: coverImage,
        category,
        read_time: readTime,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Blog post published");
      router.push("/admin/blog");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Could not save post");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1.5" />
        {slug && <p className="mt-1 text-xs text-muted-foreground">URL: /blog/{slug}</p>}
      </div>

      <ImageUploadField
        type="blog"
        slug={slug}
        currentUrl={coverImage || undefined}
        label="Featured image"
        aspect="aspect-16/9"
        refreshOnSuccess={false}
        onUploaded={setCoverImage}
      />

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          placeholder="Separate paragraphs with a blank line."
          className="mt-1.5 w-full rounded-xl border border-input bg-cream px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="readTime">Read time</Label>
          <Input id="readTime" value={readTime} onChange={(e) => setReadTime(e.target.value)} className="mt-1.5" />
        </div>
      </div>

      <Button type="submit" variant="default" size="lg" className="w-fit" disabled={saving}>
        {saving ? "Publishing..." : "Publish Post"}
      </Button>
    </form>
  );
}
