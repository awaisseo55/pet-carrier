import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductTable } from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
import { getAllProducts } from "@/lib/products";
import { getAllCategoryNodes } from "@/lib/category-store";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategoryNodes()]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Products</h1>
          <p className="mt-1 text-gray-500">{products.length} product(s) in your catalogue.</p>
        </div>
        <Button variant="default" asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Add from Amazon URL
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <ProductTable products={products} categories={categories} />
      </div>
    </div>
  );
}
