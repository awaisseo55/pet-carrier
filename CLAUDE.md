# Pet Carrier — CLAUDE.md

Project rules for working on pet-carrier.co.uk. Read this before making changes.

## What this is

Pet Carrier is a UK e-commerce store, positioned as **"Everything for your pet on the move and at
rest."** Primary focus is pet carriers (all pet types), with strollers and beds as secondary
categories. We do not sell toys, food, treats, grooming or health products, that's out of scope.

Products are sourced from Amazon UK via a family member's Amazon Business account, repackaged and
dispatched under the Pet Carrier brand by a UK Ltd company. Owner: Muhammad Awais, an SEO
professional. Goal: build a profitable, curated e-commerce brand, potentially sold in 12 to 18
months. That means the code should stay clean and easy for a buyer's technical due diligence, not
just easy for us to hack on.

## Tech stack

- Next.js 15 App Router, TypeScript, React 19
- Tailwind CSS v4 (CSS-based `@theme`, no `tailwind.config.js`)
- shadcn/ui-style components in `components/ui/` (hand-maintained, not CLI-generated)
- Framer Motion for subtle animation, lucide-react for icons
- next-themes for optional dark mode (light is default and primary)
- Data layer: JSON files under `/data` (`products.json`, `orders.json`, `customers.json`,
  `settings.json`, `homepage.json`, `blog.json`, `coupons.json`, `category-content.json`),
  accessed only through `lib/*.ts` helpers. Never read/write these files directly from a page or
  API route, go through the lib functions so the storage layer can be swapped for
  Supabase/Postgres later without touching call sites. The actual disk I/O for these files is
  centralised in `lib/data-store.ts`: locally it reads/writes the files in `/data` exactly as
  before, but on Vercel (whose serverless filesystem is read-only outside `/tmp`) it transparently
  reads and writes the same JSON through **Cloudflare R2** instead (S3-compatible, via
  `@aws-sdk/client-s3`, see `lib/r2-client.ts`), once the R2 env vars are set. **Never use
  `@vercel/blob`**, that store was retired in favour of R2's much larger free tier. Storage is
  split across **two R2 buckets** on the same account: `R2_DATA_BUCKET_NAME` has no public access
  enabled and holds the `/data/*.json` files (customer emails, password hashes and order details
  live in these and must never be fetchable by URL, reads/writes go through authenticated
  `GetObjectCommand`/`PutObjectCommand` only), and `R2_BUCKET_NAME` has its public dev URL enabled
  and holds product/category/hero images only, served directly as
  `${NEXT_PUBLIC_R2_PUBLIC_URL}/<key>` with no proxy route. **Never write anything containing
  customer data to `R2_BUCKET_NAME`** or enable public access on `R2_DATA_BUCKET_NAME`, that would
  make it fetchable by anyone who guesses the key. This keeps the JSON-shaped data model and the
  `lib/*.ts` call sites unchanged, see `.env.local.example` for setup. Product/category/hero image
  uploads have the equivalent split in `lib/image-store.ts`. Never write to the local filesystem
  when running on Vercel, it's read-only outside `/tmp`.
- **Never overwrite an R2 data file (`products.json`, `reviews.json`, `orders.json`, `customers.json`,
  `category-content.json`, etc.) with the local git-tracked copy from `/data`.** Real incident: an
  out-of-band script pushed the local `products.json` straight to R2 to add a couple of fields, which
  silently reset every product's `averageRating`/`reviewCount`/`ratingBreakdown` back to unset,
  because those fields are runtime-only, computed by `syncProductRatingStats()` in `lib/reviews.ts`
  and never committed to git. Production had genuine customer reviews live at the time; the fix took
  two days to notice because the review *list* still rendered correctly (it reads `reviews.json`
  fresh), only the star-rating summary silently reverted to "Be the first to review". The same class
  of loss applies to anything else computed and written back at runtime rather than authored in git:
  order records, coupon usage counts, admin-added custom categories (`category-content.json`'s
  `custom`/`deleted` arrays). **If you ever need to script a direct R2 write outside the running app
  (emergency fix, backfill, migration), always read the current live object from R2 first, patch only
  the specific fields you intend to change, and write that back, never `PutObjectCommand` a
  locally-sourced file wholesale.** The one safe exception is a first-time seed of a file that has
  never been written to in production.
- **Product images**: `NEXT_PUBLIC_R2_PUBLIC_URL` is a custom domain
  (`images.pet-carrier.co.uk`) attached to the R2 bucket via Cloudflare, and `next.config.ts` sets
  `images.unoptimized: true`, so images are served straight from R2 with no Vercel image
  optimisation in between. See the **"Product images: rules to prevent broken images"** section
  below before touching anything image-related, it documents three separate real production
  outages and the exact rules that prevent each one recurring.
- Stripe for card payments (Checkout Sessions, redirect flow, discounts applied as one-time Stripe
  coupons) plus an optional cash-on-delivery flow behind a feature flag, Resend for transactional
  email, Anthropic Claude for AI content rewriting of Amazon listings, cheerio + sharp for the
  Amazon scrape/image pipeline. See the **"Transactional email"** and **"Cash on delivery
  checkout"** sections below.
- Vitest for automated tests (`npm run test`), covering the shared checkout calculation, coupon
  and free-shipping rules, HTML escaping, contact-form validation, order idempotency, and Resend's
  thrown-vs-returned error handling. Config in `vitest.config.ts`, tests in `tests/`.

## Product images: rules to prevent broken images

Product images have broken in production three separate times from three genuinely different
causes. Read this in full before changing anything related to image storage, domains, or
`next.config.ts`'s `images` block, don't assume a fix for one of these automatically covers the
others.

**Current architecture** (as of the 2026-08 R2 custom-domain migration): product/category/hero
images live in the public R2 bucket (`R2_BUCKET_NAME`), served via a Cloudflare custom domain at
`NEXT_PUBLIC_R2_PUBLIC_URL` (currently `images.pet-carrier.co.uk`, attached to the bucket under R2
→ Custom Domains in the Cloudflare dashboard). `next.config.ts` sets `images.unoptimized: true`, so
`next/image` serves the R2 file directly as-is rather than proxying it through Vercel's
`/_next/image` optimiser. This is deliberate, not a shortcut: `lib/image-pipeline.ts` already
resizes and converts every upload to correctly-sized WebP (1200×1200 main, 400×400 thumb, 2000px-cap
zoom) at upload time, so there's no real optimisation left for Vercel to do, and leaving Vercel's
optimiser in the loop is what caused two of the three outages below.

**The three failure modes, so you recognise them if they recur:**

1. **A stale/dead image URL sitting in data that nothing checks.** A prior incomplete Vercel Blob →
   R2 migration left four products with a `/api/blob/...` URL (a deleted proxy route) in
   `variants[0].colourImage`, invisible because it's a nested field, not the top-level `images[]`
   array everyone reflexively checks. Symptom: that product's default/hero image was broken, other
   images on the same product were fine.
2. **The R2 public bucket's free `*.r2.dev` "dev" URL is rate-limited and not meant for production**
   (Cloudflare's own documentation says so). `next/image`'s optimiser (when not `unoptimized`)
   re-fetches every `srcset` width from the origin on every cache miss, generating far more origin
   requests than a plain `<img>` tag, and can trip that rate limit under real traffic. Symptom:
   images broken on first load, then loading fine once clicked into (a plain `<img>` tag, e.g. the
   lightbox in `components/product/image-lightbox.tsx`, only ever needs one request).
3. **Vercel's Image Optimization has its own monthly usage quota on the Hobby plan, keyed by source
   URL.** Bulk-migrating every product image to a new hostname (to fix #2) made all ~400 of them
   look like brand-new source images to Vercel's optimiser at once, which exceeded the quota and
   made `/_next/image` return `402 Payment Required` for every product image sitewide, even though
   the images themselves were fine and directly reachable. Symptom: every product image broken
   everywhere, but the page itself and every other asset (JS, CSS, fonts) returns 200. This is why
   `unoptimized: true` is now set, it removes Vercel's optimiser from the path entirely so this
   class of failure can't recur.
4. **Cloudflare's edge cache can hold a stale copy of an R2 object key even after the origin object
   has been overwritten**, despite the response showing `cf-cache-status: DYNAMIC` (which describes
   that specific request, not a guarantee the URL was never cached elsewhere/earlier). Confirmed in
   practice: uploading a wrong image to a key, then overwriting the same key with the correct image,
   left the bare URL intermittently serving the old bytes on repeat `curl` checks, while a
   cache-busting `?t=` query string reliably returned the fresh content. Symptom: an image looks
   correct when checked with a cache-busting param but wrong (or stale) when requested at its real,
   bare URL, exactly as the browser/`next/image` will request it, with no way to see this from the
   admin UI or the JSON data alone. **Never overwrite an R2 image key to "fix" wrong content once
   the bare URL may have been requested even once. Upload to a brand-new key instead** and update
   the record to point at that new key, then verify the *bare* URL (no query string) directly.

**Strict rules going forward:**

- **Never re-enable Vercel's image optimiser** (i.e. never remove `images.unoptimized: true` from
  `next.config.ts`) without a deliberate reason, and if you do, re-read failure modes #2 and #3
  above first and check the current Vercel plan's Image Optimization quota before doing anything
  that touches many image URLs at once.
- **Whenever you change where an image is served from** (new bucket, new domain, re-upload,
  storage migration), grep/search every field that can hold an image URL, not just `images[]`:
  that's `images[]`, `variants[].colourImage`, category/hero images in
  `data/category-content.json`, and `data/homepage.json`. `scripts/check-image-domains.mjs`
  (`npm run check:images`) checks `images[]` and `variants[].colourImage` automatically, extend it
  if a new image-bearing field is ever added to `Product` or elsewhere.
- **Run `npm run check:images` before every push that touches product data or image config.** It
  cross-checks every image hostname in `data/products.json` against `next.config.ts`'s configured
  hostnames and flags anything on a `.r2.dev` dev subdomain.
- **Never point `NEXT_PUBLIC_R2_PUBLIC_URL` at a `pub-<hash>.r2.dev` dev URL for production.**
  Always use a proper custom domain attached to the bucket via Cloudflare R2 → Custom Domains (this
  requires the domain's zone to exist in the same Cloudflare account, a bare external CNAME without
  the zone present will not work, confirmed by trial).
- **When changing `NEXT_PUBLIC_R2_PUBLIC_URL` (or any env var `next.config.ts` reads), update it in
  Vercel's dashboard *and* trigger a fresh deploy in the same sitting.** Saving an env var alone
  does not rebuild anything; a deployment that started building before the save can silently ship
  with the old value baked in. Confirm the correct value actually shipped by checking a real
  `/_next/image` or image request in the deployed site's Network tab, not just that the env var
  shows "saved" in Vercel's UI.
- **A `200` on the page itself proves nothing about images.** A broken image can hide behind a
  perfectly successful page load. When verifying an image fix, check the actual image request's
  status code (Network tab, filter by the image extension or `_next/image`), not just that the page
  renders without a 500.
- **If product images are reported broken, check the browser Network tab's actual response codes
  before assuming a cause.** All three failure modes above produce visually identical symptoms
  (broken image icons) but need completely different fixes, don't guess from memory, verify.

## Voice and content rules

- **British English throughout**: colour, favourite, organise, £ not $. This is a hard rule.
- **Never use em dashes.** Use commas, colons, semicolons, brackets, or split into two sentences.
- Warm, friendly, professional tone, not corporate, not overly casual. Focus on the pet owner's
  experience.
- **Never make health claims.** Say "designed for comfort", not "prevents anxiety" or "reduces
  stress". Products are carriers, strollers and beds, not medical devices.
- AI-generated product copy must be rewritten, not copied from Amazon. See `lib/ai-content.ts`.

## Product description formatting

Product descriptions are stored as markdown-lite text in `data/products.json` and rendered by
`lib/markdown-lite.tsx` (`renderRichText`), a small hand-rolled parser, not `react-markdown` or
`@tailwindcss/typography`. It splits on blank lines, so **every heading line must be followed by a
blank line before its paragraph text**, e.g.:

```
### Sturdy Frame with a Wooden Support Board

A reinforced cage structure keeps its shape...
```

not `### Sturdy Frame with a Wooden Support Board\nA reinforced cage structure...` on one line,
which the old block-splitter used to merge into a single bold `<h3>` (heading text and paragraph
concatenated). `renderRichText` now also defensively splits off only the first line of a heading
block as the heading even if a stray single newline slips in, but always author new descriptions
with a full blank line after every `##`/`###` heading regardless.

- H2 sections (`## `, e.g. "Key Features and Benefits") render as prominent section headings.
- H3 subsections under a `## Key Features` block (`### `) render as visually distinct feature
  titles, on their own line, with clear spacing above and below, never as inline bold text merged
  into the following paragraph.
- Never rely on CSS alone to fix heading/paragraph merging, if a heading and its text run together
  it's almost always a missing blank line in the stored markdown, not a styling bug.

## Internal linking

Product descriptions link to category pages inline as `[anchor text](/carriers/...)`, rendered by
`lib/markdown-lite.tsx`. There is no automated link-generation logic in the codebase, links are
authored directly into the description text, so these rules apply whenever writing or editing
product copy:

- Anchor text must contain the keyword that describes the destination category, e.g. link "dog
  sling" (not "hands-free") to `/carriers/dog-carriers/dog-slings`, "small dogs" to
  `/carriers/dog-carriers/small-dog-carriers`, "vet visits" to `/carriers/vet-visit-carriers`,
  "rabbit carrier" to `/carriers/small-animal-carriers/rabbit-carriers`. A short, natural
  descriptor that matches the category's distinguishing word(s) is fine (`"small dogs"`, `"car
  travel"`), it does not need to spell out "carrier" every time.
- Never link generic words or persona phrases ("your pet", "these", "here", "cat owners", a bare
  "carrier"/"hands-free" that names a feature rather than the destination) to a specific category
  page. Linking a single generic word like "carrier" to the top-level `/carriers` hub is fine,
  since that word is the hub's own keyword; it is not fine for a specific subcategory.
- If the destination's keyword doesn't appear naturally in the sentence, skip the link rather than
  force it onto the wrong word, a small rewrite to work the keyword in naturally is preferable to
  either forcing a mismatched anchor or leaving the paragraph unlinked.

## Design system (do not deviate without asking)

Rebuilt 2026-07 to match Chewy.com's clean white e-commerce aesthetic: white backgrounds
throughout, navy/blue brand accent, orange CTAs. Not warm/editorial, not dark. This replaced an
earlier emerald/coral palette; if you see stray `emerald-*`/`coral-*` classes used as link or brand
accent colour (as opposed to the deliberate uses below), that's a regression, fix it to blue.

- **Backgrounds**: pure white (`bg-white`) is the default everywhere on the public site and the
  admin content area. `bg-gray-50` (#F9FAFB) for alternating section backgrounds, `bg-gray-100`
  (#F3F4F6) for subtle muted emphasis (image placeholders etc). The **only** two places allowed to
  use a dark background are the site **footer** and the **admin sidebar/mobile nav**, both
  `bg-gray-800` (#1F2937). Nothing else, ever, not a modal, drawer, card, or homepage section.
  Cart drawer, cart page, checkout, and every admin content page must be white.
- **Text**: near-black (`text-ink`, #111827) for headings and important text, medium-dark gray
  (`text-gray-500`/`text-gray-600`) for secondary/body text. Never go lighter than `text-gray-500`
  for meaningful text on a white background (`text-gray-400` is fine only for large decorative
  icons). On the dark footer/admin sidebar, use white for primary text and `text-gray-300` for
  muted/inactive text.
- **Colours** (all defined in `app/globals.css` under `@theme`):
  - **Primary/CTA** (Add to Basket, Checkout, Sign In, and any primary action button): orange,
    `coral-500` (#F97316), hover `coral-600` (#EA580C). This is what the `Button` component's
    `default`/`primary` variant renders. Don't reuse orange for incidental "selected" states
    (checkboxes, radios, active thumbnails, active nav) — that's blue, see below.
  - **Brand/link accent**: blue, using Tailwind's stock `blue-600`/`blue-700`/`blue-800` palette
    (#2563EB / #1D4ED8 / #1E40AF) — these are Tailwind defaults, not custom tokens. Used for the
    header logo, nav hover/active state, inline links, category eyebrow labels, checked
    checkboxes/radios, selected thumbnails, and hover backgrounds (`blue-50`/`#EFF6FF`).
  - **Success/positive** (`success`/`success-light` tokens, emerald): reserved for "In Stock",
    applied-coupon confirmations, and the free-shipping-progress state. Don't use emerald as a
    generic accent colour elsewhere, that's blue's job now.
  - **Warning** (`warning`/`warning-light` tokens, amber #F59E0B): low-stock indicators only.
  - **Alert/discount** (`alert`/`alert-light` tokens, red #DC2626): error messages, and "Save £X"
    discount badges/sale pricing (`Badge` `secondary` variant, and the product price itself when a
    `compare_at_price` is set).
  - Star ratings are amber (`amber-400`), independent of the above, matching the near-universal
    gold-star convention.
- **Fonts**: `Inter` for both headings (`font-heading` / `--font-inter`) and body. Prices and
  numbers use `tabular-nums` (set globally on `body`). Never use Fraunces, Geist, or Manrope, those
  belong to other brands under the same operator (Manrope was this brand's old heading font, pre
  rebrand, don't bring it back).
- **Shape language**: `rounded-md` on buttons (not pill-shaped, that's the old brand), `rounded-lg`
  on cards. Icon avatars/circles and badges can still be `rounded-full`. Soft shadows only,
  `shadow-sm` to `shadow-md`, no custom heavy shadow utilities.
- **Light mode only.** There is no dark mode toggle in the UI and no `.dark` CSS overrides in
  `globals.css`; `next-themes` is wired up with `defaultTheme="light"` and `enableSystem={false}`
  purely so `components/ui/sonner.tsx` has a theme context, it does not change any styling. Don't
  add `dark:` Tailwind classes or reintroduce `prefers-color-scheme`-based theming.
- **Header navigation must always be visible without hovering.** This was a real bug once
  (invisible nav text), treat any regression here as critical. Only the Carriers mega menu panel
  itself is hover-triggered, the nav labels are not. The header also has a persistent, prominent
  search bar in the centre on `md`+ screens (Chewy-style), collapsing to a toggle icon on mobile.

## Category architecture

This is the part most likely to trip up future changes, read carefully.

- The full category tree (carriers, strollers, beds and every subcategory, around 70 nodes) is
  defined in code in `lib/categories.ts` as `CATEGORIES`. Each node has a `path` (e.g.
  `"carriers/dog-carriers/puppy-carriers"`), `section`, `level`, `parentPath`, `animal` and
  `descriptor`. Adding a node there is enough to publish a fully SEO-ready page, content is
  generated automatically.
- `lib/category-content.ts` generates the intro, why-choose, sizing guide and FAQ copy for a
  category from its `animal` and `descriptor` fields, using templated variation so pages don't
  read as duplicated. Don't hand-write prose for all ~70 categories, extend the templates instead.
- `lib/category-store.ts` layers admin edits on top: `data/category-content.json` holds per-path
  overrides (name, intro, FAQs, image, featured products), plus any admin-added custom categories
  and soft-deleted paths. `getResolvedCategory(path)` merges the code-defined defaults with these
  overrides, always use it rather than reading `CATEGORIES` directly when rendering a page.
- Every category is a real route via `app/[section]/[[...path]]/page.tsx`, an optional catch-all
  that matches `/carriers`, `/carriers/dog-carriers`, `/carriers/dog-carriers/puppy-carriers`, and
  the equivalent under `/strollers` and `/beds`. `generateStaticParams` pre-renders the ~70 built-in
  nodes, admin-added custom categories render on demand (Next's default `dynamicParams`), so they
  don't need a redeploy to go live.
- Products reference categories via `Product.category_slugs: string[]`, a product can (and often
  should) belong to several categories. `getProductsByCategoryIncludingDescendants` is what powers
  hub pages, e.g. `/carriers/dog-carriers` shows products tagged with any of its subcategories, not
  just the hub path itself.

## Architecture notes

- `lib/products.ts`, `lib/orders.ts`, `lib/customers.ts`, `lib/blog.ts`, `lib/settings.ts`,
  `lib/homepage.ts`, `lib/coupons.ts`, `lib/category-store.ts` are all marked `"server-only"` and
  read/write the JSON files in `/data`. They must only be imported from Server Components or Route
  Handlers, never from a `"use client"` file. If a client component needs a shared constant, it
  lives in `lib/constants.ts` instead, which has no server-only dependency.
- Admin auth is a single shared password (`ADMIN_PASSWORD` env var) with a signed HTTP-only
  cookie, see `lib/admin-auth.ts`. Customer auth (`lib/customers.ts`, `lib/auth.ts`) is separate
  and per-account.
- The Amazon import pipeline is three steps, kept as separate modules:
  1. `lib/amazon.ts` scrapes a product URL with cheerio (best-effort, Amazon can block this).
  2. `lib/ai-content.ts` rewrites the scraped data into original copy via Claude, with a
     rule-based fallback if `ANTHROPIC_API_KEY` is unset or the call fails, and suggests likely
     `category_slugs` from the product title.
  3. `lib/image-pipeline.ts` downloads and converts images to WebP, then stores them via
     `lib/image-store.ts` (`/public/uploads/product/[asin]/` locally, the public R2 bucket in
     production).
- All admin image uploads (category, hero, blog, product) go through the single
  `/api/admin/upload` route, resized and converted to WebP by sharp, then persisted via
  `lib/image-store.ts` (same local-vs-R2 split as the data layer above). Images are uploaded to
  `R2_BUCKET_NAME`, which has public access enabled, so the resulting URL is
  `${NEXT_PUBLIC_R2_PUBLIC_URL}/<key>` directly, no proxy route. `lib/placeholders.ts` resolves the
  effective image for categories and the hero: admin upload (cache-busted) → curated, visually
  verified Unsplash image → generic placeholder.
- Cart state lives in React Context + localStorage (`components/cart/cart-context.tsx`), including
  applied coupon and saved-for-later items. Carts are anonymous until checkout.
- Checkout uses Stripe's hosted Checkout Session (redirect flow), not Stripe Elements. Customer
  details and delivery address are collected on our own multi-section `/checkout` page first, then
  passed to Stripe via session metadata (not `shipping_address_collection`) so the customer isn't
  asked twice. Orders are only created from the `checkout.session.completed` webhook, never
  optimistically on the client. Cash on delivery (see below) is the other payment path and creates
  its order synchronously in the API route instead, there's no webhook involved.
- Coupons (`lib/coupons.ts`, `data/coupons.json`) are validated both client-side (for cart display)
  and server-side in `lib/checkout-calculation.ts` (source of truth for both Stripe and COD),
  applied to Stripe via a one-time `stripe.coupons.create` rather than manipulating line item
  prices directly.
- **Never trust a price, title, image or the internal Amazon fulfilment link from the client.**
  Both checkout routes (`/api/checkout/session` for card, `/api/checkout/cod` for cash on
  delivery) accept only `{ product_id, variant_sku?, quantity }` line references from the browser.
  `lib/checkout-calculation.ts`'s `calculateCheckout()` is the single place that looks up real
  product/variant data server-side, rejects missing/inactive/out-of-stock items, and computes
  subtotal/discount/shipping/VAT/total, used by both payment methods so the pricing rules can't
  drift between them. `lib/checkout-validation.ts` similarly shares customer/address validation
  between the two routes (COD additionally requires a UK address and a phone number).

## Transactional email

- All outbound email goes through `lib/email.ts`, a single server-only service, never call the
  Resend SDK directly from a route handler. It reads `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`,
  `CUSTOMER_REPLY_TO_EMAIL` and `RESEND_FROM_EMAIL` (all server-only, never `NEXT_PUBLIC_`), with
  safe fallback defaults if any are unset. If `RESEND_API_KEY` is unset, sends are skipped with a
  console warning rather than throwing, so a missing key never breaks order creation.
- **Resend only sends mail, it does not receive it.** A customer replying to an order email lands
  in `CUSTOMER_REPLY_TO_EMAIL`'s real inbox directly (currently a Gmail address, intended to move
  to `info@pet-carrier.co.uk` later, just by changing the env var), it never comes back through
  this app or through Resend's API. There is no inbound-email handling anywhere in the codebase.
- Every customer-controlled value (name, address lines, delivery instructions, tracking number)
  must go through `escapeHtml()` from `lib/email.ts` before it reaches an HTML email string. The
  shared `renderLayout()`/`itemsTableHtml()`/`totalsHtml()`/`addressHtml()` helpers in that file
  already do this, don't hand-build a new HTML block without escaping.
- `resend.emails.send()` can return `{ error }` **without throwing**, `lib/email.ts`'s
  `sendTrackedEmail()` checks both the returned error and a thrown exception, logs clearly (never
  logging the API key itself), and returns `false` rather than throwing further. Order creation
  always happens before the email send, so a failed send never causes a successfully recorded
  order to disappear or roll back.
- Every send also passes a deterministic `idempotencyKey` (e.g. `order-confirmation-{orderId}`)
  and a Resend tag (`order_confirmation`, `owner_new_order`, `order_dispatched`, `order_cancelled`,
  `order_delivered`, `contact_form`, `test_email`). Combined with the durable per-order
  `*_email_sent_at` marker fields on `Order` (checked before ever attempting a send, and only set
  after a confirmed success), this is what stops webhook retries, repeated identical admin status
  updates or page refreshes from sending the same email twice.
- `app/api/admin/test-email/route.ts` (admin-auth gated, or dev mode) sends a controlled test via
  `sendTestEmail()`, triggered from a small card on the admin Settings page. It never runs
  automatically during a build, test run or deploy.

## Cash on delivery checkout

- Off by default. `ENABLE_CASH_ON_DELIVERY` must be exactly `"true"` (checked via
  `lib/feature-flags.ts`'s `isCodEnabled()`) for the option to appear on `/checkout` or for
  `/api/checkout/cod` to accept requests; otherwise the route responds `404` as if it doesn't
  exist, and the checkout page hides the radio option entirely. The public `/api/settings/public`
  endpoint exposes this as a plain boolean, it isn't a secret.
- A COD order is created directly in `/api/checkout/cod`, synchronously, with
  `payment_method: "cash_on_delivery"`, `payment_status: "pending"` and `status: "pending_payment"`
  (the same status card orders start in, they're told apart by `payment_method`, not a separate
  status enum value), and no `stripe_session_id`, that field is optional on `Order` specifically so
  a COD order never needs a fabricated one. Coupon usage is incremented once, after the order is
  successfully created.
- `Order.payment_method` is absent on every order created before this feature existed, always read
  it through `getOrderPaymentMethod(order)` in `lib/orders.ts` rather than the raw field, it
  defaults an absent value to `"card"`.
- The checkout success page (`/checkout/success`) never fetches order details by a bare ID. For
  Stripe it polls `/api/checkout/session/verify?session_id=...`, which returns only a boolean, and
  only clears the cart once that's `true`. For COD the order summary is handed back directly in
  the `/api/checkout/cod` response and carried to the success page via `sessionStorage`, since the
  order was already created before the redirect.
- Admin can mark a COD order's `payment_status` to `paid` from the Orders page once the courier has
  collected payment (`components/admin/order-row.tsx`'s "Mark as paid" button). This only ever
  patches `payment_status` through the normal admin orders route, it never calls Stripe.
- Dispatch emails (`sendDispatchEmail`) use `Order.courier_name` / `tracking_number` /
  `tracking_url`, all optional and settable from the admin Orders page before the order is even
  marked dispatched. `isSafeTrackingUrl()` in `lib/email.ts` only renders `tracking_url` as a
  clickable link when it's a genuine `http(s)` URL, never trust it blindly even though it's
  admin-entered.

## Adding products

When the user provides Amazon URL(s) to add as products, follow `docs/PRODUCT-WORKFLOW.md` exactly.
Try automatic fetching first (`fetchAmazonProductWithFallback` in `lib/amazon.ts`), then fall back to
requesting manual image URLs only once every automatic method has genuinely failed. **Never use
Unsplash or any other stock photo site for product images** — a listing must show the actual item
being sold. Before trusting an ASIN's title, brand or images, verify them against the real Amazon
page rather than taking supplied copy at face value, a mismatched brand/product on a live listing is
a trading-standards problem, not just a content bug.

## Known TODOs (see inline `// TODO:` comments for exact locations)

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: placeholders, add real
  keys before launch.
- `RESEND_API_KEY`: unset by default locally, order/contact emails are logged to console instead
  of sent (see the **"Transactional email"** section, this is implemented, just needs the key set
  per environment). `CUSTOMER_REPLY_TO_EMAIL` is currently a personal Gmail address, intended to
  move to `info@pet-carrier.co.uk` once that inbox exists, just by changing the env var.
- `ENABLE_CASH_ON_DELIVERY`: off by default, set to `"true"` to offer cash on delivery at checkout,
  see the **"Cash on delivery checkout"** section.
- `ANTHROPIC_API_KEY`: unset by default, Amazon import falls back to rule-based content.
- `KEEPA_API_KEY` / `lib/products.ts` `syncProductWithKeepa`: not implemented, wire up once order
  volume justifies automated price/stock sync with Amazon.
- Data layer is JSON files for MVP simplicity. Migrate to Supabase/Postgres once traffic or order
  volume make file-based storage a bottleneck, the `lib/*.ts` functions are the seam to change.
- No verified Unsplash photo found yet for strollers specifically, see the TODO in `lib/images.ts`,
  generic pet lifestyle images are used as a placeholder there instead.

## When making changes

- Keep new pages statically generated where possible (`generateStaticParams`,
  `generateMetadata`), this is an SEO-driven business.
- Every customer-facing page needs a unique meta title/description and canonical URL. Check
  `lib/seo.ts` for the JSON-LD helpers (Organization, WebSite, BreadcrumbList, Product,
  CollectionPage, FAQPage, Article) before writing new structured data by hand.
- **Never trust an Unsplash photo ID from memory.** A prior build shipped dogs under the cat
  category, a hamster under birds, and a hero image with a competitor's logo visible, all because
  photo IDs were guessed rather than verified. If you add a new image, download it and actually
  look at it (or use the WebSearch → resolve → download → view workflow) before committing the
  URL.
- Don't add a database, ORM, or new state management library without discussing it first, the
  whole point of the JSON file approach is to keep this migratable and simple to inspect while the
  store is small.
- Run `npm run build` before considering a change done, this project should always build cleanly.
  Run `npm run test` too if the change touches checkout, pricing, coupons, orders or email, it
  should always pass.
- **Standing authorization: commit and push to `main` automatically once a change builds cleanly and
  passes its tests, without asking first.** Vercel auto-deploys `main`, so a change that isn't pushed
  isn't live, and the owner has explicitly said not to be asked each time, that's what this line is
  for. This does not extend to force-pushes, history rewrites, or any other destructive git
  operation, those still require asking.
