import { ManualProductForm } from "@/components/admin/manual-product-form";

export default function ManualProductPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Add Product Manually</h1>
      <p className="mt-1 text-gray-500">Enter details directly instead of importing from Amazon.</p>
      <div className="mt-6 max-w-3xl">
        <ManualProductForm />
      </div>
    </div>
  );
}
