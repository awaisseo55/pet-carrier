# Pet Carrier — CLAUDE.md

Project rules for working on pet-carrier.co.uk. Read this before making changes.

## What this is

Pet Carrier is a UK e-commerce store selling curated pet carriers (dogs, cats, small animals,
birds), sourced from Amazon UK via a family member's Amazon Business account, repackaged and
dispatched under the Pet Carrier brand by a UK Ltd company. Same operator as calculio.co.uk, but a
**separate brand with a separate design identity**. Do not reuse Calculio's visual style, fonts or
colours here.

Owner: Muhammad Awais, an SEO professional. Goal: build a profitable, curated e-commerce brand,
potentially sold in 12 to 18 months. That means the code should stay clean and easy for a buyer's
technical due diligence, not just easy for us to hack on.

## Tech stack

- Next.js 15 App Router, TypeScript, React 19
- Tailwind CSS v4 (CSS-based `@theme`, no `tailwind.config.js`)
- shadcn/ui-style components in `components/ui/` (hand-maintained, not CLI-generated)
- Framer Motion for subtle animation, lucide-react for icons
- next-themes for optional dark mode (light is default and primary)
- Data layer: JSON files under `/data` (`products.json`, `orders.json`, `customers.json`,
  `settings.json`, `blog.json`), accessed only through `lib/*.ts` helpers. Never read/write these
  files directly from a page or API route, go through the lib functions so the storage layer can
  be swapped for Supabase/Postgres later without touching call sites.
- Stripe for payments (Checkout Sessions, redirect flow), Resend for transactional email,
  Anthropic Claude for AI content rewriting of Amazon listings, cheerio + sharp for the Amazon
  scrape/image pipeline.

## Voice and content rules

- **British English throughout**: colour, favourite, organise, £ not $. This is a hard rule.
- **Never use em dashes.** Use commas, colons, semicolons, brackets, or split into two sentences.
- Warm, friendly, conversational tone, like a friend who cares about pets, not a corporate store.
- **Never make health claims.** Say "designed for comfort", not "prevents anxiety" or "reduces
  stress". Products are carriers, not medical devices.
- AI-generated product copy must be rewritten, not copied from Amazon. See `lib/ai-content.ts`.

## Design system (do not deviate without asking)

This is a warm, boutique pet-niche aesthetic. Not minimal, not corporate, not cold.

- **Colours**: sage green primary (`sage-*` scale), terracotta/clay orange secondary
  (`terracotta-*` scale), warm cream background (`--color-cream`), soft dark brown text
  (`--color-brown`), pale beige muted cards (`--color-cream-dark`). No pure white (`#fff`), no pure
  black, no cold blues. All defined in `app/globals.css` under `@theme`.
- **Fonts**: `Fraunces` (serif) for headings via `font-serif` / `--font-fraunces`, `Inter` (sans)
  for body via `--font-inter`. Never use Geist, that's Calculio's font.
- **Shape language**: rounded corners everywhere, `rounded-2xl`/`rounded-3xl` on cards,
  `rounded-full` on buttons. Soft shadows (`shadow-warm`, `shadow-warm-lg` utilities), never harsh
  drop shadows.
- Light mode is the default and the primary experience. Dark mode exists via next-themes but is
  secondary, don't design a feature that only works in one mode.

## Architecture notes

- `lib/products.ts`, `lib/orders.ts`, `lib/customers.ts`, `lib/blog.ts`, `lib/settings.ts` are all
  marked `"server-only"` and read/write the JSON files in `/data`. They must only be imported from
  Server Components or Route Handlers, never from a `"use client"` file. If a client component
  needs a shared constant (like the list of pet types), it lives in `lib/constants.ts` instead,
  which has no server-only dependency.
- Admin auth is a single shared password (`ADMIN_PASSWORD` env var) with a signed HTTP-only cookie,
  see `lib/admin-auth.ts`. This is intentionally simple for the MVP with one admin user. Customer
  auth (`lib/customers.ts`, `lib/auth.ts`) is separate and per-account.
- The Amazon import pipeline is three steps, kept as separate modules so each can be tested or
  swapped independently:
  1. `lib/amazon.ts` scrapes a product URL with cheerio (best-effort, Amazon can block this).
  2. `lib/ai-content.ts` rewrites the scraped data into original copy via Claude, with a
     rule-based fallback if `ANTHROPIC_API_KEY` is unset or the call fails.
  3. `lib/image-pipeline.ts` downloads and converts images to WebP under
     `/public/products/[asin]/` once the admin confirms and saves.
- Cart state lives in React Context + localStorage (`components/cart/cart-context.tsx`), not a
  server session, carts are anonymous until checkout.
- Checkout uses Stripe's hosted Checkout Session (redirect flow), not Stripe Elements. Orders are
  only created from the `checkout.session.completed` webhook, never optimistically on the client.

## Known TODOs (see inline `// TODO:` comments for exact locations)

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: placeholders, add real
  keys before launch.
- `RESEND_API_KEY`: unset by default, order/contact emails are logged to console instead of sent.
- `ANTHROPIC_API_KEY`: unset by default, Amazon import falls back to rule-based content.
- `KEEPA_API_KEY` / `lib/products.ts` `syncProductWithKeepa`: not implemented, wire up once order
  volume justifies automated price/stock sync with Amazon.
- Data layer is JSON files for MVP simplicity. Migrate to Supabase/Postgres once traffic or order
  volume make file-based storage a bottleneck, the `lib/*.ts` functions are the seam to change.

## When making changes

- Keep new pages statically generated where possible (`generateStaticParams`,
  `generateMetadata`), this is an SEO-driven business.
- Every customer-facing page needs a unique meta title/description. Check `lib/seo.ts` for the
  JSON-LD helpers (Organization, BreadcrumbList, Product) before writing new structured data by
  hand.
- Don't add a database, ORM, or new state management library without discussing it first, the
  whole point of the JSON file approach is to keep this migratable and simple to inspect while the
  store is small.
- Run `npm run build` before considering a change done, this project should always build cleanly.
