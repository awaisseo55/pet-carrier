import { AddProductTabs } from "@/components/admin/add-product-tabs";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Add Product</h1>
      <p className="mt-1 text-gray-500">
        Import from Amazon, add manually, bulk import a CSV, or paste a batch of Amazon URLs.
      </p>
      <div className="mt-6">
        <AddProductTabs />
      </div>
    </div>
  );
}
