import Link from "next/link";
import { AmazonImport } from "@/components/admin/amazon-import";

export default function NewProductPage() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Add Product from Amazon</h1>
          <p className="mt-1 text-gray-500">
            Paste an Amazon UK product URL, review the AI-rewritten content, then publish.
          </p>
        </div>
        <Link href="/admin/products/new-manual" className="text-sm font-medium text-emerald-700 hover:underline">
          Or add a product manually &rarr;
        </Link>
      </div>
      <div className="mt-6">
        <AmazonImport />
      </div>
    </div>
  );
}
