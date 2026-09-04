import { getActiveProducts } from "@/lib/products";
import { getAllCategoryNodes } from "@/lib/category-store";
import { buildMerchantFeedXml } from "@/lib/merchant-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [products, categories] = await Promise.all([getActiveProducts(), getAllCategoryNodes()]);
  const categoryNameByPath = new Map(categories.map((c) => [c.path, c.name]));
  const xml = buildMerchantFeedXml(products, categoryNameByPath);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
