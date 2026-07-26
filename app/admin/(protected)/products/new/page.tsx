import { AmazonImport } from "@/components/admin/amazon-import";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Add Product from Amazon</h1>
      <p className="mt-1 text-brown-soft">
        Paste an Amazon UK product URL, review the AI-rewritten content, then publish.
      </p>
      <div className="mt-6">
        <AmazonImport />
      </div>
    </div>
  );
}
