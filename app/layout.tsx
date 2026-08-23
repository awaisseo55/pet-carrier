import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { CartProvider } from "@/components/cart/cart-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pet-carrier.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pet Carrier | Carriers, Strollers & Beds for Every Pet",
  description:
    "Everything for your pet on the move and at rest. Carriers, strollers and beds for dogs, cats, small animals and birds. UK based, free shipping over £50, 30-day returns.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Pet Carrier",
    url: siteUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pet Carrier — comfortable carriers for every companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  verification: {
    google: "Xm5CVKVsQ9gUGZCYm0Jo0Tg-9xse4KGvx_WYuQkAO2E",
  },
};

export const viewport = {
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="oe+0WxSevsXawq740ab8Pw"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
