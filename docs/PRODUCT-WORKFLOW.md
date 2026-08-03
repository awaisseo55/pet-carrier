# Adding a product from an Amazon URL

This is the standard process for turning an Amazon listing into a published Pet Carrier product,
whether done through the admin panel or scripted. It always tries automatic fetching first, and
only asks for manual image URLs once every automatic method has genuinely failed. **Never use
Unsplash (or any stock photo site) for product images** — a product page must show the actual item
being sold, sourced from Amazon or supplied directly.

## 1. Automatic fetching, in order

`lib/amazon.ts`'s `fetchAmazonProductWithFallback(url)` tries three methods in sequence and stops
at the first one that returns at least one image. Each attempt (success or failure, with a reason)
is recorded so the outcome can be reported honestly rather than silently falling back.

1. **ASIN-based image URLs** (`tryAsinImagePatterns`): guesses the legacy
   `images-na.ssl-images-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_.jpg`-style CDN path. This only
   works for a minority of older catalogue listings, modern Amazon image URLs use an opaque hash
   unrelated to the ASIN, so expect this to fail most of the time. It's tried first because it's
   the cheapest check (a HEAD-equivalent fetch, no HTML parsing).
2. **Open Graph tags** (`tryOpenGraphFetch`): fetches the product page and reads `og:title`,
   `og:description`, and `og:image` meta tags. Lighter-weight than full scraping and occasionally
   still present on pages where Amazon serves a simplified or partially-blocked response.
3. **Direct scraping** (`scrapeAmazonProduct`): the full cheerio-based scrape of `#productTitle`,
   price blocks, feature bullets, and the `hiRes`/`landingImage` image sources. Most complete when
   it works, but also the most likely to be blocked by Amazon's bot detection.

## 2. If all three methods fail

Do not publish a product with no real images. Instead:

- Create the product record with `is_active: false` and a clear marker (e.g. a `"[NEEDS IMAGES]"`
  prefix in an internal note, or leaving `images: []`) so it's visibly incomplete in the admin
  products list rather than silently missing.
- Log the Amazon URL that needs attention.
- Tell the user exactly what to do: visit the URL, right-click each product image to copy its
  direct image URL, and paste those into the admin panel (or re-run the import once URLs are
  supplied) to complete the listing.

## 3. Processing images once source URLs exist (whether auto-fetched or manually supplied)

Use `downloadAndProcessProductImageSet(id, imageUrls)` from `lib/image-pipeline.ts` (from the admin
panel / API routes), or `scripts/fetch-product-images.mjs <id> '["url", ...]'` for scripted/CLI use
outside the Next.js server (that script duplicates the same logic in plain Node, since `lib/`
files are guarded by `"server-only"` and only resolve correctly inside Next's build/dev server).
For every
source URL it downloads with a real browser User-Agent (some CDNs reject obvious bot strings) and
writes three WebP variants under `/public/uploads/product/[id]/`:

- `image-N-main.webp` — 1200x1200, cropped to fill. This is what `Product.images[]` should
  reference; it's what the gallery and product cards display.
- `image-N-thumb.webp` — 400x400, cropped to fill. Reserved for a future thumbnail-strip
  optimisation, not currently wired into the UI.
- `image-N-zoom.webp` — longest side capped at 2000px, full frame preserved (no cropping).
  Reserved for a future zoom/lightbox feature, not currently wired into the UI.

The first URL in the list is always the primary/hero image.

## 4. Content and categorisation

- Write `description` as the markdown-lite subset `lib/markdown-lite.tsx` understands: `## `
  headings, `### ` sub-headings, blank-line-separated paragraphs, `- ` bullet lists, and inline
  `[label](/category/path)` links to relevant category pages. It's rendered with `renderRichText`,
  not raw HTML, so keep to that subset.
- Pull any "Specifications" content into the structured `specifications: Record<string,string>`
  field (rendered in its own dedicated section) rather than leaving it as prose in `description`,
  to avoid showing the same information twice.
- Pull any FAQ content into the structured `faqs: {question, answer}[]` field (rendered as an
  accordion) rather than leaving it as a `## Frequently Asked Questions` section in `description`.
- Assign `category_slugs` using real paths from `lib/categories.ts` (verify with
  `getCategoryByPath`), the first one listed is the primary category shown in the breadcrumb and
  the eyebrow label on the product page.
- When keyword-based auto-categorisation is used (no explicit category given), match against
  `CATEGORIES` by `animal`/`descriptor`/`name` keywords found in the scraped title, and fall back to
  the closest hub category rather than leaving `category_slugs` empty.

## 5. Variants (size and/or colour)

Only use this if the Amazon listing genuinely has sibling ASINs for other sizes/colours (visible as
swatches/a dropdown on the product page, or discoverable via the page's `dimensionValuesDisplayData`
JSON). Most listings don't, in which case leave `hasVariants` unset and treat the product as a single
listing exactly as before, don't invent variants that don't exist.

- Set `hasVariants: true`, `variantType: "size" | "colour" | "size-colour"`, and populate
  `variants: ProductVariant[]` (see `lib/types.ts`). Each variant needs its own `sku` and `inStock`,
  and `size`/`sizeLabel` and/or `colour`/`colourHex`/`colourImage` depending on `variantType`.
- The top-level `price` field becomes the lowest variant price (what the product card and the "From
  £X" fallback on the product page use before a variant is selected). Leave `compare_at_price` null
  unless a specific variant has one.
- Only include a `colourImage` for variants where you have a genuine photo of that colour, the
  gallery falls back to the product's normal `images[]` otherwise, don't reuse another colour's photo.
- If you can't verify a real price for every sibling variant (Amazon's fetch can be just as unreliable
  per-variant as it is per-product, see section 2), it's fine to reuse the one verified variant's price
  across the others rather than guessing a different number, but never invent stock/price data you
  haven't seen on the real listing. When in doubt, leave the whole product `is_active: false` until
  it's verified, same as any other pending listing.
- `components/product/variant-selector.tsx` renders the size/colour picker on the product page,
  `components/product/product-purchase-section.tsx` owns the selected-variant state (drives the
  gallery image, price, stock badge and add-to-cart SKU together), and `lib/variants.ts` has the
  shared helpers (`variantLabel`, `variantPriceRange`, `distinctSizes`, `distinctColours`). None of
  these need touching to add a variant product, only the data does.

## 6. Publishing

Call `upsertProduct` from `lib/products.ts` (matches by `id`, so re-running the workflow for the
same ASIN updates the existing record rather than creating a duplicate). Only set `is_active: true`
once real images and a title exist, if either automatic fetching stage genuinely failed, leave the
product inactive and marked as needing manual completion per section 2.
