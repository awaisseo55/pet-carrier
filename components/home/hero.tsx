import Image from "next/image";
import Link from "next/link";
import { getHeroImageUrl } from "@/lib/placeholders";
import { getHomepageSettings } from "@/lib/homepage";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

/**
 * Editorial split hero: headline and actions on cream at the left, a single
 * large lifestyle photograph framed in sage at the right. No icon rows, no
 * floating stat chips, no gradient scrims, the photograph does the work.
 */
export async function Hero() {
  const [{ url: heroImageUrl, isCustom }, homepage] = await Promise.all([
    getHeroImageUrl(),
    getHomepageSettings(),
  ]);

  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:py-16">
        <div className="lg:col-span-5">
          <Reveal direction="up">
            <h1 className="text-[2.6rem] leading-[1.06] text-forest-800 sm:text-5xl lg:text-[3.6rem]">
              {homepage.hero_heading}
            </h1>
          </Reveal>

          <Reveal direction="up" delay={0.12}>
            <span className="mt-6 block h-[3px] w-20 rounded-full bg-ember-500" />
          </Reveal>

          <Reveal direction="up" delay={0.2}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-600">
              {homepage.hero_subheading}
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/carriers"
                className="rounded-xl bg-forest-800 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-900 hover:shadow-md"
              >
                Shop carriers
              </Link>
              <Link
                href="#find-your-fit"
                className="rounded-xl border border-forest-300 bg-white px-7 py-3.5 text-sm font-bold text-forest-800 transition-all hover:-translate-y-0.5 hover:border-forest-600 hover:bg-forest-50"
              >
                Find the right fit
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal direction="left" duration={0.7}>
            <div className="rounded-[2rem] bg-forest-100 p-2.5 sm:p-3">
              <Parallax distance={18}>
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-[1.6rem]">
                  <Image
                    src={heroImageUrl}
                    alt={
                      isCustom
                        ? "Pet Carrier hero image"
                        : "A pug settled comfortably into a stylish grey pet carrier"
                    }
                    fill
                    priority
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Parallax>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
