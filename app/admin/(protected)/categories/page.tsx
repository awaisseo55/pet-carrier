import { CATEGORIES } from "@/lib/categories";
import { getCategoryImageUrl } from "@/lib/placeholders";
import { CategoryImageUpload } from "@/components/admin/category-image-upload";

export default async function AdminCategoriesPage() {
  const images = await Promise.all(
    CATEGORIES.map(async (category) => ({
      category,
      ...(await getCategoryImageUrl(category.value)),
    }))
  );

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Categories</h1>
      <p className="mt-1 text-brown-soft">
        Upload a custom photo for each top-level category. Until you do, a curated default photo is
        shown on the site.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {images.map(({ category, url, isCustom }) => (
          <CategoryImageUpload
            key={category.value}
            category={category.value}
            label={category.label}
            url={url}
            isCustom={isCustom}
          />
        ))}
      </div>
    </div>
  );
}
