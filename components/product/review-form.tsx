"use client";

import * as React from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { PublicReview, ReviewStatus } from "@/lib/types";

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ReviewFormProps {
  productSlug: string;
  onSuccess: (review: PublicReview | null, status: ReviewStatus) => void;
  onCancel: () => void;
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const [hovered, setHovered] = React.useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="cursor-pointer p-1"
        >
          <Star
            className={cn(
              "size-7 transition-colors sm:size-6",
              star <= display ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ productSlug, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [authorName, setAuthorName] = React.useState("");
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [authorEmail, setAuthorEmail] = React.useState("");
  const [images, setImages] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const previews = React.useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);
  React.useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("Photos must be JPG, PNG or WebP.");
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError("Each photo must be under 5MB.");
        continue;
      }
      accepted.push(file);
    }
    setImages((prev) => [...prev, ...accepted].slice(0, MAX_IMAGES));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) return setError("Please choose a star rating.");
    if (body.trim().length < 10) return setError("Your review needs to be at least 10 characters.");
    if (!isAnonymous && authorName.trim().length === 0) {
      return setError("Please enter your name, or choose to post anonymously.");
    }
    if (!authorEmail.trim()) return setError("Please enter your email address.");

    setSubmitting(true);
    const formData = new FormData();
    formData.set("productSlug", productSlug);
    formData.set("rating", String(rating));
    formData.set("title", title.trim());
    formData.set("body", body.trim());
    formData.set("authorName", authorName.trim());
    formData.set("isAnonymous", String(isAnonymous));
    formData.set("authorEmail", authorEmail.trim());
    images.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/reviews/create", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit your review. Please try again.");
        setSubmitting(false);
        return;
      }
      onSuccess(data.review, data.review?.status ?? "approved");
    } catch {
      setError("Could not submit your review. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-lg border border-border bg-gray-50 p-5 sm:p-6"
    >
      {/* Honeypot: real customers never see or fill this field in. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div>
        <Label>Your rating</Label>
        <div className="mt-1.5">
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>

      <div>
        <Label htmlFor="review-title">Review title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          placeholder="Sum up your experience"
          maxLength={100}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="review-body">Your review</Label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          placeholder="What did you like or dislike? How did your pet get on with it?"
          rows={4}
          maxLength={2000}
          className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{body.length}/2000</p>
      </div>

      <div>
        <Label>Photos (optional, up to {MAX_IMAGES})</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors",
            dragOver ? "border-blue-500 bg-blue-50" : "border-border"
          )}
        >
          {previews.map((src, index) => (
            <div key={src} className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- transient local object URL preview, not a stored/optimizable asset */}
              <img src={src} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label="Remove photo"
                className="absolute top-0.5 right-0.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white text-gray-400 hover:text-blue-600"
            >
              <ImagePlus className="size-5" />
              <span className="text-[10px]">Add</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="review-name">Your name</Label>
          <Input
            id="review-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value.slice(0, 50))}
            placeholder="Jane Smith"
            maxLength={50}
            disabled={isAnonymous}
            className="mt-1.5"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Checkbox checked={isAnonymous} onCheckedChange={(checked) => setIsAnonymous(checked === true)} />
            Post anonymously
          </label>
        </div>

        <div>
          <Label htmlFor="review-email">Email</Label>
          <Input
            id="review-email"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="jane@example.com"
            className="mt-1.5"
          />
          <p className="mt-2 text-xs text-muted-foreground">Never shown publicly, for our records only.</p>
        </div>
      </div>

      {error && <p className="text-sm text-alert">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
