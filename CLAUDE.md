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
  Supabase/Postgres later without touching call sites.
- Stripe for payments (Checkout Sessions, redirect flow, discounts applied as one-time Stripe
  coupons), Resend for transactional email, Anthropic Claude for AI content rewriting of Amazon
  listings, cheerio + sharp for the Amazon scrape/image pipeline.

## Voice and content rules

- **British English throughout**: colour, favourite, organise, £ not $. This is a hard rule.
- **Never use em dashes.** Use commas, colons, semicolons, brackets, or split into two sentences.
- Warm, friendly, professional tone, not corporate, not overly casual. Focus on the pet owner's
  experience.
- **Never make health claims.** Say "designed for comfort", not "prevents anxiety" or "reduces
  stress". Products are carriers, strollers and beds, not medical devices.
- AI-generated product copy must be rewritten, not copied from Amazon. See `lib/ai-content.ts`.

## Design system (do not deviate without asking)

This is a clean, modern, product-focused e-commerce look. Reference vibes: Chewy, Pets at Home,
Petco, Zooplus. Not warm/editorial, not dark.

- **Colours**: white background (`bg-white`) throughout, light gray (`bg-gray-50`) for alternating
  section backgrounds. Text: near-black (`text-ink`), medium gray (`text-gray-500`) secondary,
  light gray (`text-gray-400`) muted. Primary/CTA: emerald green (`emerald-600`, hover
  `emerald-700`). Secondary/accent: coral orange (`coral-500`), used sparingly for sale badges and
  energy. All defined in `app/globals.css` under `@theme`.
- **Fonts**: `Manrope` for headings via `font-heading` / `--font-manrope`, `Inter` for body via
  `--font-inter`. Prices and numbers use `tabular-nums` (set globally on `body`). Never use
  Fraunces or Geist, those belong to other brands under the same operator.
- **Shape language**: moderate rounded corners, `rounded-lg` on cards and inputs (not
  `rounded-2xl`/`rounded-3xl`, that reads too soft for this brand), `rounded-full` on buttons and
  pills. Soft shadows only, `shadow-sm` to `shadow-md`, no custom heavy shadow utilities.
- Light mode is the default and the primary experience. Dark mode exists via next-themes but is
  secondary, don't design a feature that only works in one mode.
- **Header navigation must always be visible without hovering.** This was a real bug once
  (invisible nav text), treat any regression here as critical. Only the Carriers mega menu panel
  itself is hover-triggered, the nav labels are not.

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
  3. `lib/image-pipeline.ts` downloads and converts images to WebP under
     `/public/uploads/product/[asin]/` once the admin confirms and saves.
- All admin image uploads (category, hero, blog, product) go through the single
  `/api/admin/upload` route and land under `/public/uploads/[type]/`, resized and converted to
  WebP by sharp. `lib/placeholders.ts` resolves the effective image for categories and the hero:
  admin upload (checked by file mtime, cache-busted) → curated, visually verified Unsplash image →
  generic placeholder.
- Cart state lives in React Context + localStorage (`components/cart/cart-context.tsx`), including
  applied coupon and saved-for-later items. Carts are anonymous until checkout.
- Checkout uses Stripe's hosted Checkout Session (redirect flow), not Stripe Elements. Customer
  details and delivery address are collected on our own multi-section `/checkout` page first, then
  passed to Stripe via session metadata (not `shipping_address_collection`) so the customer isn't
  asked twice. Orders are only created from the `checkout.session.completed` webhook, never
  optimistically on the client.
- Coupons (`lib/coupons.ts`, `data/coupons.json`) are validated both client-side (for cart display)
  and server-side at checkout session creation (source of truth), applied to Stripe via a one-time
  `stripe.coupons.create` rather than manipulating line item prices directly.

## Known TODOs (see inline `// TODO:` comments for exact locations)

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: placeholders, add real
  keys before launch.
- `RESEND_API_KEY`: unset by default, order/contact emails are logged to console instead of sent.
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
