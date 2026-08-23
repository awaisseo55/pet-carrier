"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { slugify } from "@/lib/utils";
import { authors, reviewers } from "@/lib/people";
import type { BlogPost } from "@/lib/types";
import { toast } from "sonner";

const AUTHOR_OPTIONS = authors();
const REVIEWER_OPTIONS = reviewers();

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [content, setContent] = React.useState(post?.content ?? "");
  const [category, setCategory] = React.useState(post?.category ?? "Pet Care");
  const [author, setAuthor] = React.useState(post?.author ?? AUTHOR_OPTIONS[0]?.name ?? "");
  const [reviewedBy, setReviewedBy] = React.useState(post?.reviewed_by ?? REVIEWER_OPTIONS[0]?.name ?? "");
  const [reviewedByRole, setReviewedByRole] = React.useState(
    post?.reviewed_by_role ?? REVIEWER_OPTIONS[0]?.title ?? ""
  );
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
        <Select value={author} onValueChange={setAuthor}>
          <SelectTrigger id="author" className="mt-1.5 w-full">
            <SelectValue placeholder="Select an author" />
          </SelectTrigger>
          <SelectContent>
            {AUTHOR_OPTIONS.map((a) => (
              <SelectItem key={a.slug} value={a.name}>
                {a.name}, {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Shown as the byline and linked to the author&apos;s profile page. New authors are added in{" "}
          <code>lib/people.ts</code>.
        </p>
      </div>

      <div>
        <Label htmlFor="reviewedBy">Reviewed by (optional)</Label>
        <Select
          value={reviewedBy || "__none"}
          onValueChange={(value) => {
            if (value === "__none") {
              setReviewedBy("");
              setReviewedByRole("");
              return;
            }
            setReviewedBy(value);
            setReviewedByRole(REVIEWER_OPTIONS.find((r) => r.name === value)?.title ?? "");
          }}
        >
          <SelectTrigger id="reviewedBy" className="mt-1.5 w-full">
            <SelectValue placeholder="No reviewer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No reviewer (hide this line)</SelectItem>
            {REVIEWER_OPTIONS.map((r) => (
              <SelectItem key={r.slug} value={r.name}>
                {r.name}, {r.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Only credit a real person who genuinely reviewed this post. New reviewers are added in{" "}
          <code>lib/people.ts</code>.
        </p>
      </div>

      <Button type="submit" variant="default" size="lg" className="w-fit" disabled={saving}>
        {saving ? "Saving..." : isEdit ? "Save Changes" : "Publish Post"}
      </Button>
    </form>
  );
}
