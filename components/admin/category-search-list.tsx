"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CategoryNode } from "@/lib/categories";
import { toast } from "sonner";

export function CategorySearchList({
  nodes,
  productCounts,
}: {
  nodes: CategoryNode[];
  productCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q ? nodes.filter((n) => n.name.toLowerCase().includes(q) || n.path.includes(q)) : nodes;

  async function handleDelete(path: string, name: string) {
    if (!confirm(`Delete "${name}"? This hides it from the site. This cannot be easily undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/categories/${path}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      toast.error("Could not delete that category");
    }
  }

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="pl-9"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-gray-500">
              <th className="p-3">Category</th>
              <th className="p-3">Section</th>
              <th className="p-3">Level</th>
              <th className="p-3">Products</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((node) => (
              <tr key={node.path} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium">{node.name}</p>
                  <p className="text-xs text-gray-400">/{node.path}</p>
                </td>
                <td className="p-3 capitalize">{node.section}</td>
                <td className="p-3">{node.level}</td>
                <td className="p-3">{productCounts[node.path] || 0}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/admin/categories/edit?path=${node.path}`} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={() => handleDelete(node.path, node.name)}
                      disabled={busy}
                    >
                      <Trash2 className="size-4 text-alert" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-gray-500">No categories match your search.</p>}
      </div>
    </div>
  );
}
