"use client";

import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { PetType } from "@/lib/types";

export function CategoryImageUpload({
  category,
  label,
  url,
  isCustom,
}: {
  category: PetType;
  label: string;
  url: string;
  isCustom: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <ImageUploadField
        type="category"
        slug={category}
        currentUrl={url}
        isCustom={isCustom}
        label={label}
      />
    </div>
  );
}
