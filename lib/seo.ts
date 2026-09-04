import { personSlug } from "./people";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pet-carrier.co.uk";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pet Carrier",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Everything for your pet on the move and at rest.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "10 Stafford Road",
      addressLocality: "Preston",
      postalCode: "PR1 6LB",
      addressCountry: "GB",
    },
    sameAs: [
      "https://www.instagram.com/petcarrieruk",
      "https://www.facebook.com/petcarrieruk",
      "https://www.tiktok.com/@petcarrieruk",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@pet-carrier.co.uk",
      areaServed: "GB",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pet Carrier",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/carriers?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  url,
  items = [],
}: {
  name: string;
  description: string;
  url: string;
  /** Each item's own page, so the ItemList points somewhere rather than just naming products. */
  items?: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${siteUrl}${url}`,
    ...(items.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              url: `${siteUrl}${item.url}`,
            })),
          },
        }
      : {}),
  };
}

export function articleJsonLd(post: {
  title: string;
  excerpt: string;
  cover_image: string;
  slug: string;
  author: string;
  reviewed_by?: string;
  reviewed_by_role?: string;
  published_at: string;
  updated_at?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image.startsWith("http") ? post.cover_image : `${siteUrl}${post.cover_image}`,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Person",
      name: post.author,
      url: `${siteUrl}/author/${personSlug(post.author)}`,
    },
    ...(post.reviewed_by
      ? {
          reviewedBy: {
            "@type": "Person",
            name: post.reviewed_by,
            jobTitle: post.reviewed_by_role,
            url: `${siteUrl}/reviewer/${personSlug(post.reviewed_by)}`,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "Pet Carrier",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/placeholders/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  };
}

export function productJsonLd(
  product: {
    title: string;
    short_description: string;
    images: string[];
    slug: string;
    price: number;
    compare_at_price?: number | null;
    sku: string;
    brand: string;
    stock_status: string;
    variants?: { price: number; sku: string; inStock: boolean }[];
  },
  ratings?: {
    averageRating: number;
    reviewCount: number;
    reviews: { rating: number; authorName: string; createdAt: string; body: string }[];
  }
) {
  const offers =
    product.variants && product.variants.length > 0
      ? {
          "@type": "AggregateOffer",
          url: `${siteUrl}/product/${product.slug}`,
          priceCurrency: "GBP",
          lowPrice: Math.min(...product.variants.map((v) => v.price)).toFixed(2),
          highPrice: Math.max(...product.variants.map((v) => v.price)).toFixed(2),
          offerCount: product.variants.length,
          availability: product.variants.some((v) => v.inStock)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        }
      : {
          "@type": "Offer",
          url: `${siteUrl}/product/${product.slug}`,
          priceCurrency: "GBP",
          price: product.price.toFixed(2),
          availability:
            product.stock_status === "out_of_stock"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
        };

  const hasRatings = !!ratings && ratings.reviewCount > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description,
    image: product.images.map((img) => (img.startsWith("http") ? img : `${siteUrl}${img}`)),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || "Pet Carrier",
    },
    offers,
    ...(hasRatings && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ratings!.averageRating.toFixed(1),
        reviewCount: ratings!.reviewCount,
        bestRating: "5",
        worstRating: "1",
      },
      review: ratings!.reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
        },
        author: {
          "@type": "Person",
          name: r.authorName,
        },
        datePublished: r.createdAt,
        reviewBody: r.body,
      })),
    }),
  };
}

export { siteUrl };
