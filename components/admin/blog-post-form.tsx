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
import { estimateReadingTime } from "@/lib/reading-time";
import type { BlogFaq, BlogPost } from "@/lib/types";
import { toast } from "sonner";

const AUTHOR_OPTIONS = authors();
const REVIEWER_OPTIONS = reviewers();

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function faqsToText(faqs?: BlogFaq[]): string {
  if (!faqs || faqs.length === 0) return "";
  return faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
}

function textToFaqs(text: string): BlogFaq[] {
  const faqs: BlogFaq[] = [];
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const qMatch = block.match(/^Q:\s*(.+)$/m);
    const aMatch = block.match(/^A:\s*([\s\S]+)$/m);
    if (qMatch && aMatch) {
      faqs.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
    }
  }
  return faqs;
}

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
  const [coverImage, setCoverImage] = React.useState(post?.cover_image ?? "");
  const [quickAnswerText, setQuickAnswerText] = React.useState((post?.quick_answer ?? []).join("\n"));
  const [checklistHeading, setChecklistHeading] = React.useState(post?.checklist_heading ?? "");
  const [checklistItemsText, setChecklistItemsText] = React.useState((post?.checklist_items ?? []).join("\n"));
  const [commonMistakesText, setCommonMistakesText] = React.useState((post?.common_mistakes ?? []).join("\n"));
  const [editorialNote, setEditorialNote] = React.useState(post?.editorial_note ?? "");
  const [faqsText, setFaqsText] = React.useState(faqsToText(post?.faqs));
  const [relatedSlugsText, setRelatedSlugsText] = React.useState((post?.related_slugs ?? []).join(", "));
  const [saving, setSaving] = React.useState(false);

  const newSlugPreview = slugify(title);
  const readingTimePreview = estimateReadingTime(content, linesToArray(faqsText));

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
      quick_answer: linesToArray(quickAnswerText),
      checklist_heading: checklistHeading || undefined,
      checklist_items: linesToArray(checklistItemsText),
      common_mistakes: linesToArray(commonMistakesText),
      editorial_note: editorialNote || undefined,
      faqs: textToFaqs(faqsText),
      related_slugs: relatedSlugsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
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
        <p className="mt-1 text-xs text-muted-foreground">Also used as the meta description shown in search results.</p>
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
            "and **bold** for emphasis. Headings automatically become table of contents entries."
          }
          className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Estimated reading time: {readingTimePreview} (calculated automatically from the word count, not editable).
        </p>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5" />
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Optional content blocks</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Leave any of these blank to hide that section on the published article. Not every article needs every
          block, use whichever genuinely suit the topic.
        </p>
      </div>

      <div>
        <Label htmlFor="quickAnswer">Key takeaways (one per line)</Label>
        <textarea
          id="quickAnswer"
          value={quickAnswerText}
          onChange={(e) => setQuickAnswerText(e.target.value)}
          rows={4}
          placeholder="Shown as a Key Takeaways box right after the introduction."
          className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <div>
          <Label htmlFor="checklistHeading">Checklist heading</Label>
          <Input
            id="checklistHeading"
            value={checklistHeading}
            onChange={(e) => setChecklistHeading(e.target.value)}
            placeholder="e.g. Quick Carrier Checklist"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="checklistItems">Checklist items (one per line)</Label>
          <textarea
            id="checklistItems"
            value={checklistItemsText}
            onChange={(e) => setChecklistItemsText(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="commonMistakes">Common mistakes to avoid (one per line, optional)</Label>
        <textarea
          id="commonMistakes"
          value={commonMistakesText}
          onChange={(e) => setCommonMistakesText(e.target.value)}
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <Label htmlFor="editorialNote">Editor&apos;s note (optional)</Label>
        <textarea
          id="editorialNote"
          value={editorialNote}
          onChange={(e) => setEditorialNote(e.target.value)}
          rows={2}
          placeholder="A short editorial callout, e.g. a reminder that every pet is different."
          className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <Label htmlFor="faqs">FAQs (Q: / A: pairs, one blank line between each)</Label>
        <textarea
          id="faqs"
          value={faqsText}
          onChange={(e) => setFaqsText(e.target.value)}
          rows={8}
          placeholder={"Q: How do I know what size carrier I need?\nA: Measure your pet's length, height and weight..."}
          className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <Label htmlFor="relatedSlugs">Related article slugs (comma separated, optional)</Label>
        <Input
          id="relatedSlugs"
          value={relatedSlugsText}
          onChange={(e) => setRelatedSlugsText(e.target.value)}
          placeholder="e.g. helping-a-nervous-cat-get-used-to-a-carrier, flying-with-your-pet-what-uk-airlines-expect"
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave blank to fall back to the most recent posts in the same category. Comparison tables aren&apos;t
          editable here yet, ask for one to be added directly if a specific article needs it.
        </p>
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Author &amp; reviewer</h2>
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
