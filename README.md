# Pet Carrier

"Everything for your pet on the move and at rest." A UK e-commerce store selling carriers,
strollers and beds, built with Next.js 15, TypeScript and Tailwind CSS v4. See
[`CLAUDE.md`](./CLAUDE.md) for full project rules, design system and category architecture.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4, shadcn/ui-style components, Framer Motion, lucide-react
- JSON-file data layer under `/data` (products, orders, customers, categories, homepage, blog,
  coupons, settings), see `lib/*.ts` for the access functions
- Stripe Checkout for payments (with coupon support), Resend for transactional email, Claude API
  for AI content rewriting in the admin's Amazon import flow
- Deployed on Vercel

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Site structure

- `/carriers`, `/strollers`, `/beds` and around 70 subcategory pages under them, all real routes
  generated from `lib/categories.ts` via `app/[section]/[[...path]]/page.tsx`. See `CLAUDE.md` for
  how to add or edit categories.
- `/product/[slug]` for individual products.
- `/cart`, `/checkout` for the shopping flow.
- `/account`, `/account/login`, `/account/register` for customers.
- `/blog`, `/blog/[slug]` for content marketing.
- `/admin` for the store owner, see below.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values before going live. Everything
has a safe fallback for local development:

| Variable | Required for | Fallback if unset |
|---|---|---|
| `ADMIN_PASSWORD` | `/admin` login | `changeme` (change this immediately) |
| `SESSION_SECRET` | signed cookies | insecure dev default |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | checkout | checkout API returns a friendly "not configured" error |
| `RESEND_API_KEY` | order/contact emails | emails are logged to the server console instead of sent |
| `ANTHROPIC_API_KEY` | AI-rewritten product copy | falls back to simple rule-based content |
| `KEEPA_API_KEY` | Amazon price/stock sync | not implemented yet, see TODO in `lib/products.ts` |

## Admin panel

Visit `/admin`, log in with `ADMIN_PASSWORD`. From there:

- **Dashboard**: product/category counts, pending orders, revenue, recent orders.
- **Products**: add from an Amazon URL (auto-fetch, AI rewrite, category suggestions, then edit
  everything before publishing), or add manually. Edit, delete, bulk price/stock updates, upload
  extra images per product.
- **Categories**: all ~70 categories, search and edit any of them, override the generated name,
  copy, meta tags, FAQs, category image and featured products. Add brand new categories, or remove
  ones you don't need.
- **Coupons**: create percentage or fixed-amount discount codes with minimum order value, expiry
  and usage limits, toggle active/inactive.
- **Homepage**: hero image, heading, subheading, trust badges and featured product.
- **Blog**: write and publish posts with a featured image.
- **Orders**: view orders (created automatically by the Stripe webhook once payments are live),
  update status (pending payment → paid → ordered from Amazon → dispatched → delivered), copy
  Amazon reorder links.
- **Settings**: store details, contact info, social links, VAT rate, currency, default markup
  percentage, shipping costs for each delivery speed.

## Data storage

Products, orders, customers, categories, homepage content, blog posts, coupons and settings live
as JSON files in `/data`. This keeps things simple to inspect and edit while the store is small.
All reads/writes go through the functions in `lib/*.ts`, so migrating to Supabase or Postgres later
only means rewriting those files, not every page that uses them.

## Key scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run the production build locally
npm run lint     # eslint
```

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new), it will auto-detect Next.js.
3. Add all the environment variables from `.env.local.example` in the Vercel project settings.
4. Add the `pet-carrier.co.uk` domain under Vercel → Project → Settings → Domains, and point its
   DNS at Vercel per their instructions.
5. In Stripe, add a webhook endpoint pointing at
   `https://pet-carrier.co.uk/api/webhooks/stripe` listening for `checkout.session.completed`,
   then copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. Every push to `main` auto-deploys via Vercel's GitHub integration.

## What's intentionally left as a TODO

See `CLAUDE.md` for the full list. In short: real Stripe keys, Resend domain verification, an
Anthropic API key for AI content generation, and Keepa price/stock sync are all wired up in code
with clear `// TODO:` comments but not activated, so the site runs end to end locally without any
of them configured.
