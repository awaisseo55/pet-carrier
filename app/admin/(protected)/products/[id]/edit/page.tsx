import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { getProductById } from "@/lib/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Edit Product</h1>
      <p className="mt-1 text-brown-soft">{product.title}</p>
      <div className="mt-6">
        <ProductEditForm product={product} />
      </div>
    </div>
  );
}
