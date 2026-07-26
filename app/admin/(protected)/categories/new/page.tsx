import { getAllCategoryNodes } from "@/lib/category-store";
import { NewCategoryForm } from "@/components/admin/new-category-form";

export default async function NewCategoryPage() {
  const nodes = await getAllCategoryNodes();

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Add Category</h1>
      <p className="mt-1 text-gray-500">New categories appear on the site immediately with generated SEO content.</p>
      <div className="mt-6">
        <NewCategoryForm nodes={nodes} />
      </div>
    </div>
  );
}
