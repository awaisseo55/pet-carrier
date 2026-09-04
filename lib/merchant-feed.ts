import "server-only";
import { escapeHtml } from "./email";
import { siteUrl } from "./seo";
import type { Product, StockStatus } from "./types";

/**
 * Google Shopping / Merchant Center product feed (RSS 2.0 + the "g:" namespace),
 * served live at /feed.xml by app/feed.xml/route.ts. Built from the same
 * getActiveProducts() every other page reads, so an admin edit (price, stock,
 * image, active/draft) is reflected on Google's next scheduled fetch with no
 * redeploy, same principle as lib/chat-context.ts's system prompt.
 *
 * identifier_exists is set to "no" everywhere: these products don't have a
 * captured GTIN/MPN yet (only the Amazon ASIN, which Google doesn't accept as
 * a substitute). Never fabricate a GTIN, an invalid one fails Google's
 * checksum validation and is a data-quality policy problem; omitting it via
 * identifier_exists is the documented, allowed alternative. Revisit once real
 * GTINs are sourced per product (see the "Known TODOs" note in CLAUDE.md).
 */

function absoluteImageUrl(url: string): string {
  return url.startsWith("http") ? url : `${siteUrl}${url}`;
}

function availabilityFromStockStatus(status: StockStatus): "in_stock" | "out_of_stock" {
  return status === "out_of_stock" ? "out_of_stock" : "in_stock";
}

/** A single, non-repeating tag. Omitted entirely when value is empty. */
function tag(name: string, value: string | undefined): string {
  if (!value) return "";
  return `    <${name}>${value}</${name}>`;
}

/** First few resolved category names for this product, used as Merchant Center's free-text product_type. */
function productTypes(product: Product, categoryNameByPath: Map<string, string>): string[] {
  return product.category_slugs
    .map((path) => categoryNameByPath.get(path))
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);
}

function itemsForProduct(product: Product, categoryNameByPath: Map<string, string>): string[] {
  if (product.images.length === 0) return [];

  const link = `${siteUrl}/product/${product.slug}`;
  const primaryImage = absoluteImageUrl(product.images[0]);
  const additionalImageTags = product.images
    .slice(1, 11)
    .map((img) => tag("g:additional_image_link", absoluteImageUrl(img)))
    .join("\n");
  const productTypeTags = productTypes(product, categoryNameByPath)
    .map((type) => tag("g:product_type", escapeHtml(type)))
    .join("\n");
  const brand = escapeHtml(product.brand);
  const description = escapeHtml(product.short_description);

  const hasUsableVariants =
    product.hasVariants && product.variants && product.variants.length > 0 && product.variants.some((v) => v.sku);

  if (hasUsableVariants) {
    return product.variants!.map((variant) => {
      const label = variant.sizeLabel || variant.colour || variant.size;
      const title = escapeHtml(label ? `${product.title} - ${label}` : product.title);
      const image = variant.colourImage ? absoluteImageUrl(variant.colourImage) : primaryImage;
      const lines = [
        tag("g:id", escapeHtml(variant.sku)),
        tag("g:item_group_id", escapeHtml(product.sku)),
        tag("title", title),
        tag("description", description),
        tag("link", link),
        tag("g:image_link", image),
        additionalImageTags,
        tag("g:condition", "new"),
        tag("g:availability", variant.inStock ? "in_stock" : "out_of_stock"),
        tag("g:price", `${variant.price.toFixed(2)} GBP`),
        tag("g:brand", brand),
        tag("g:identifier_exists", "no"),
        productTypeTags,
      ].filter(Boolean);
      return `  <item>\n${lines.join("\n")}\n  </item>`;
    });
  }

  const lines = [
    tag("g:id", escapeHtml(product.sku)),
    tag("title", escapeHtml(product.title)),
    tag("description", description),
    tag("link", link),
    tag("g:image_link", primaryImage),
    additionalImageTags,
    tag("g:condition", "new"),
    tag("g:availability", availabilityFromStockStatus(product.stock_status)),
    tag("g:price", `${product.price.toFixed(2)} GBP`),
    tag("g:brand", brand),
    tag("g:identifier_exists", "no"),
    productTypeTags,
  ].filter(Boolean);
  return [`  <item>\n${lines.join("\n")}\n  </item>`];
}

export function buildMerchantFeedXml(products: Product[], categoryNameByPath: Map<string, string>): string {
  const items = products.flatMap((product) => itemsForProduct(product, categoryNameByPath)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Pet Carrier Product Feed</title>
  <link>${siteUrl}</link>
  <description>Live product feed for Google Merchant Center</description>
${items}
</channel>
</rss>
`;
}
