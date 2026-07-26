"use client";

import { ImageUploadField } from "@/components/admin/image-upload-field";

export function HeroImageUpload({ url, isCustom }: { url: string; isCustom: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <ImageUploadField
        type="hero"
        slug="main-hero"
        currentUrl={url}
        isCustom={isCustom}
        label="Homepage hero image"
        aspect="aspect-4/5"
      />
    </div>
  );
}
