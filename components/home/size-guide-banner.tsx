import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LIFESTYLE_IMAGES } from "@/lib/images";

/**
 * Wide sage banner pairing a photograph with a single line of advice, as in
 * the reference comp. Points at the existing sizing guide in the blog rather
 * than introducing a new /size-guide URL.
 */
export function SizeGuideBanner() {
  return (
    <section className="bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-[2rem] bg-forest-100 sm:grid-cols-5">
        <div className="relative aspect-16/10 sm:col-span-2 sm:aspect-auto">
          <Image
            src={LIFESTYLE_IMAGES.carrying}
            alt="A cat being carried in a soft woven pet bag"
            fill
            sizes="(min-width: 640px) 40vw, 100vw"
            className="object-cover object-[50%_26%]"
          />
        </div>
        <div className="flex flex-col items-start justify-center gap-5 p-8 sm:col-span-3 sm:flex-row sm:items-center sm:justify-between sm:p-10 lg:p-12">
          <div>
            <h2 className="text-2xl leading-tight text-forest-800 sm:text-3xl">
              Measure once.
              <br />
              Travel comfortably.
            </h2>
            <span className="mt-4 block h-[3px] w-14 rounded-full bg-ember-500" />
          </div>
          <Link
            href="/blog/choosing-the-right-carrier-size-for-your-dog"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-forest-300 bg-white px-6 py-3 text-sm font-bold text-forest-800 transition-all hover:-translate-y-0.5 hover:border-forest-600"
          >
            Size guide
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
