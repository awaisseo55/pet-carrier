import { notFound } from "next/navigation";
import { getResolvedCategory } from "@/lib/category-store";
import { getCategoryImageUrl } from "@/lib/placeholders";
import { getAllProducts } from "@/lib/products";
import { CategoryEditForm } from "@/components/admin/category-edit-form";

export default async function EditCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path } = await searchParams;
  if (!path) notFound();

  const [resolved, categoryImage, products] = await Promise.all([
    getResolvedCategory(path),
    getCategoryImageUrl(path),
    getAllProducts(),
  ]);

  if (!resolved) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Edit Category</h1>
      <p className="mt-1 text-gray-500">/{path}</p>
      <div className="mt-6 max-w-3xl">
        <CategoryEditForm
          categoryPath={path}
          resolved={resolved}
          imageUrl={categoryImage.url}
          isCustomImage={categoryImage.isCustom}
          products={products}
        />
      </div>
    </div>
  );
}
