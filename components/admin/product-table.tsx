"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function ProductTable({
  products,
  categories,
}: {
  products: Product[];
  categories: { path: string; name: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [adjustment, setAdjustment] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [stockFilter, setStockFilter] = React.useState("all");

  const categoryNameByPath = React.useMemo(() => new Map(categories.map((c) => [c.path, c.name])), [categories]);

  const filtered = products.filter((product) => {
    if (categoryFilter !== "all" && !product.category_slugs.includes(categoryFilter)) return false;
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      if (product.is_active !== isActive) return false;
    }
    if (stockFilter !== "all" && product.stock_status !== stockFilter) return false;
    if (query.trim() && !product.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      filtered.length > 0 && prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))
    );
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Product deleted");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not delete that product");
    }
  }

  async function handleBulkPriceUpdate() {
    if (selected.size === 0 || !adjustment) return;
    setBusy(true);
    const res = await fetch("/api/admin/products/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: Array.from(selected),
        price_adjustment_percentage: Number(adjustment),
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Updated prices for ${selected.size} product(s)`);
      setSelected(new Set());
      setAdjustment("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not update prices");
    }
  }

  async function handleBulkStock(stock_status: string) {
    if (selected.size === 0) return;
    setBusy(true);
    const res = await fetch("/api/admin/products/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), stock_status }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Updated stock status for ${selected.size} product(s)`);
      setSelected(new Set());
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not update stock status");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title"
            className="h-10 pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.path} value={c.path}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="h-10 w-40">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {products.length} product(s)
      </p>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="e.g. 10 or -10"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className="h-9 w-36"
            />
            <Button size="sm" variant="outline" onClick={handleBulkPriceUpdate} disabled={busy}>
              Adjust price %
            </Button>
          </div>
          <Select onValueChange={handleBulkStock}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Set stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">
                <Checkbox
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-gray-100/30">
                <td className="p-3">
                  <Checkbox checked={selected.has(product.id)} onCheckedChange={() => toggle(product.id)} />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={product.images[0] || PRODUCT_PLACEHOLDER}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <span className="line-clamp-2 max-w-xs font-medium">{product.title}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {product.category_slugs.length === 0
                    ? "Uncategorised"
                    : categoryNameByPath.get(product.category_slugs[0]) || product.category_slugs[0]}
                  {product.category_slugs.length > 1 && ` +${product.category_slugs.length - 1}`}
                </td>
                <td className="p-3">{formatPrice(product.price)}</td>
                <td className="p-3 capitalize">{product.stock_status.replace("_", " ")}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={product.is_active ? "success" : "outline"}>
                      {product.is_active ? "Active" : "Draft"}
                    </Badge>
                    {product.images.length === 0 && <Badge variant="alert">Images needed</Badge>}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/admin/products/${product.id}/edit`} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={() => handleDelete(product.id, product.title)}
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
      </div>
    </div>
  );
}
