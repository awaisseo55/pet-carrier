import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  title: {
    default: "Pet Carrier | Carriers, Strollers & Beds for Every Pet, UK",
    template: "%s | Pet Carrier",
  },
  description:
    "Everything for your pet on the move and at rest. Carriers, strollers and beds for dogs, cats, small animals and birds. UK based, free shipping over £50, 30-day returns.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Pet Carrier",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
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
