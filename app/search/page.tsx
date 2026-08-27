import type { Metadata } from "next";
import { Search } from "lucide-react";
import { CategoryFilters } from "@/components/category/CategoryFilters";
import { searchProducts, toPublicProduct } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search",
  // Search results are dynamic and duplicate content already indexed on
  // category/product pages, so keep them out of search engines rather than
  // letting every possible query string get crawled as a thin page.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchProducts(query) : [];
  const publicResults = results.map(toPublicProduct);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {query ? `Search results for "${query}"` : "Search"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query
          ? `${publicResults.length} product${publicResults.length === 1 ? "" : "s"} found`
          : "Enter a search term to find carriers, strollers or beds."}
      </p>

      <div className="mt-8">
        {query ? (
          <CategoryFilters products={publicResults} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center">
            <Search className="size-10 text-gray-400" />
            <p className="font-medium text-foreground">Nothing to search for yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Use the search bar above to find carriers, strollers or beds by name.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
