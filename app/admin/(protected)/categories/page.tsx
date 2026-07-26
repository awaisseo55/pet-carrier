import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategorySearchList } from "@/components/admin/category-search-list";
import { getAllCategoryNodes } from "@/lib/category-store";
import { getAllProducts } from "@/lib/products";

export default async function AdminCategoriesPage() {
  const [nodes, products] = await Promise.all([getAllCategoryNodes(), getAllProducts()]);

  const counts: Record<string, number> = {};
  for (const product of products) {
    for (const slug of product.category_slugs) {
      counts[slug] = (counts[slug] || 0) + 1;
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Categories</h1>
          <p className="mt-1 text-gray-500">{nodes.length} categories across carriers, strollers and beds.</p>
        </div>
        <Button variant="default" asChild>
          <Link href="/admin/categories/new">
            <Plus className="size-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <CategorySearchList nodes={nodes} productCounts={counts} />
      </div>
    </div>
  );
}
