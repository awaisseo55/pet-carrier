import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE } from "@/lib/images";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1">
          <span className="inline-flex items-center rounded-full bg-terracotta-100 px-4 py-1.5 text-sm font-medium text-terracotta-700">
            Handpicked for happy pets
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Comfortable carriers for your favourite companions
          </h1>
          <p className="mt-5 max-w-xl text-lg text-brown-soft">
            From nervous vet visits to weekend adventures, we curate carriers designed for real
            comfort, so your dog, cat, small pet or bird always travels well.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="default" asChild>
              <Link href="/shop">Shop All Carriers</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Our Story</Link>
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
            <div>
              <dt className="text-2xl font-serif font-semibold text-sage-700">UK</dt>
              <dd className="text-sm text-muted-foreground">Based &amp; run</dd>
            </div>
            <div>
              <dt className="text-2xl font-serif font-semibold text-sage-700">40+</dt>
              <dd className="text-sm text-muted-foreground">Curated carriers</dd>
            </div>
            <div>
              <dt className="text-2xl font-serif font-semibold text-sage-700">30-day</dt>
              <dd className="text-sm text-muted-foreground">Returns</dd>
            </div>
          </dl>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-warm-lg lg:max-w-none">
            <Image
              src={HERO_IMAGE}
              alt="A happy small dog resting comfortably inside a stylish pet carrier"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
