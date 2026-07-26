"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/lib/types";
import { toast } from "sonner";

export function BlogList({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Post deleted");
      router.refresh();
    } else {
      toast.error("Could not delete that post");
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-cream-dark/40 py-16 text-center text-brown-soft">
        No blog posts yet.
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
      {posts.map((post) => (
        <li key={post.id} className="flex items-center gap-4 p-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
            <Image src={post.cover_image} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{post.title}</p>
            <p className="text-xs text-muted-foreground">
              {post.category} &middot;{" "}
              {new Date(post.published_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete post"
            onClick={() => handleDelete(post.id, post.title)}
            disabled={busy}
          >
            <Trash2 className="size-4 text-alert" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
