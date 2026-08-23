"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { slugify } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";
import { toast } from "sonner";

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [content, setContent] = React.useState(post?.content ?? "");
  const [category, setCategory] = React.useState(post?.category ?? "Pet Care");
  const [author, setAuthor] = React.useState(post?.author ?? "Pet Carrier Team");
  const [reviewedBy, setReviewedBy] = React.useState(post?.reviewed_by ?? "");
  const [reviewedByRole, setReviewedByRole] = React.useState(post?.reviewed_by_role ?? "");
  const [readTime, setReadTime] = React.useState(post?.read_time ?? "3 min read");
  const [coverImage, setCoverImage] = React.useState(post?.cover_image ?? "");
  const [saving, setSaving] = React.useState(false);

  const newSlugPreview = slugify(title);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coverImage) {
      toast.error("Please upload a featured image before publishing.");
      return;
    }
    setSaving(true);

    const payload = {
      title,
      excerpt,
      content,
      cover_image: coverImage,
      category,
      author,
      reviewed_by: reviewedBy || undefined,
      reviewed_by_role: reviewedByRole || undefined,
      read_time: readTime,
    };

    const res = isEdit
      ? await fetch(`/api/admin/blog/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (res.ok) {
      toast.success(isEdit ? "Post updated" : "Blog post published", {
        description: "It will appear on the live site within a few seconds.",
      });
      router.push("/admin/blog");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Could not save post");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1.5" />
        {isEdit ? (
          <p className="mt-1 text-xs text-muted-foreground">
            URL: /blog/{post.slug} (never changes, even if you edit the title, so existing search rankings and links aren&apos;t affected)
          </p>
        ) : (
          newSlugPreview && <p className="mt-1 text-xs text-muted-foreground">URL: /blog/{newSlugPreview}</p>
        )}
      </div>

      <ImageUploadField
        type="blog"
        slug={post?.slug ?? newSlugPreview}
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
          rows={16}
          placeholder={
            "Separate paragraphs with a blank line. Use ## for a section heading and ### for a sub-heading " +
            "(blank line before the paragraph that follows), [link text](/carriers/...) for internal links, " +
            "and **bold** for emphasis."
          }
          className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <div>
        <Label htmlFor="author">Author</Label>
        <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1.5" />
        <p className="mt-1 text-xs text-muted-foreground">
          Shown as the byline and linked to an author bio page. Author bios are configured in{" "}
          <code>lib/authors.ts</code>, so a name typed here that doesn&apos;t have an entry there will link to a
          bio page that doesn&apos;t exist yet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reviewedBy">Reviewed by (optional)</Label>
          <Input
            id="reviewedBy"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            placeholder="Leave blank to hide this line"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="reviewedByRole">Reviewer role</Label>
          <Input
            id="reviewedByRole"
            value={reviewedByRole}
            onChange={(e) => setReviewedByRole(e.target.value)}
            placeholder="e.g. Pet Specialist"
            className="mt-1.5"
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Only credit a real person who genuinely reviewed this post. Don&apos;t use a title implying a
        qualification (e.g. a veterinary credential) unless that&apos;s actually true.
      </p>

      <Button type="submit" variant="default" size="lg" className="w-fit" disabled={saving}>
        {saving ? "Saving..." : isEdit ? "Save Changes" : "Publish Post"}
      </Button>
    </form>
  );
}
