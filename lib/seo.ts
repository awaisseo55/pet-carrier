const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pet-carrier.co.uk";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pet Carrier",
    url: siteUrl,
    logo: `${siteUrl}/placeholders/logo.png`,
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

export function productJsonLd(product: {
  title: string;
  short_description: string;
  images: string[];
  slug: string;
  price: number;
  compare_at_price?: number | null;
  sku: string;
  brand: string;
  stock_status: string;
}) {
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
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      availability:
        product.stock_status === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
}

export { siteUrl };
