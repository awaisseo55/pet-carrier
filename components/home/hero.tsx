import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, Undo2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHeroImageUrl } from "@/lib/placeholders";
import { getHomepageSettings } from "@/lib/homepage";

const BADGE_ICONS: Record<string, typeof MapPin> = {
  "UK Based": MapPin,
  "Fast Dispatch": Truck,
  "30-Day Returns": Undo2,
  "Secure Checkout": ShieldCheck,
};

export async function Hero() {
  const [{ url: heroImageUrl, isCustom }, homepage] = await Promise.all([
    getHeroImageUrl(),
    getHomepageSettings(),
  ]);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1 lg:col-span-3">
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
            {homepage.hero_heading}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600 sm:text-xl">{homepage.hero_subheading}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="default" asChild>
              <Link href="/carriers">Shop Carriers</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/carriers">Explore Categories</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
            {homepage.trust_badges.map((badge) => {
              const Icon = BADGE_ICONS[badge] || ShieldCheck;
              return (
                <div key={badge} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Icon className="size-4 text-blue-600" />
                  {badge}
                </div>
              );
            })}
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-lg shadow-lg lg:max-w-none">
            <Image
              src={heroImageUrl}
              alt={
                isCustom
                  ? "Pet Carrier hero image"
                  : "A pug settled comfortably into a stylish grey pet carrier bed"
              }
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
