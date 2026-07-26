"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  type: "category" | "hero" | "blog" | "product";
  slug: string;
  currentUrl?: string;
  isCustom?: boolean;
  label: string;
  aspect?: string;
  onUploaded?: (url: string) => void;
  refreshOnSuccess?: boolean;
}

export function ImageUploadField({
  type,
  slug,
  currentUrl,
  isCustom,
  label,
  aspect = "aspect-square",
  onUploaded,
  refreshOnSuccess = true,
}: ImageUploadFieldProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [preview, setPreview] = React.useState<string | undefined>(currentUrl);

  function handlePick() {
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!slug) {
      toast.error("Add a title or name first so we know what to call the file.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("slug", slug);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setProgress(null);
      e.target.value = "";
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setPreview(data.url);
        toast.success("Image uploaded");
        onUploaded?.(data.url);
        if (refreshOnSuccess) router.refresh();
      } else {
        const data = JSON.parse(xhr.responseText || "{}");
        toast.error(data.error || "Upload failed");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      toast.error("Upload failed, please try again.");
    };
    setProgress(0);
    xhr.send(formData);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-start gap-4">
        <div className={`relative ${aspect} w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-cream-dark`}>
          {preview ? (
            <Image src={preview} alt="" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {isCustom === false && (
            <span className="text-xs text-muted-foreground">
              Using a curated default image. Upload your own to replace it.
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <Button type="button" variant="outline" size="sm" onClick={handlePick} disabled={progress !== null}>
            {progress !== null ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {preview ? "Replace image" : "Upload image"}
          </Button>
          {progress !== null && (
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-cream-dark">
              <div
                className="h-full rounded-full bg-sage-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5MB.</span>
        </div>
      </div>
    </div>
  );
}
