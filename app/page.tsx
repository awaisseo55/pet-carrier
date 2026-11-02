import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { ShopByPet } from "@/components/home/shop-by-pet";
import { CarrierFinder } from "@/components/home/carrier-finder";
import { BestSellers } from "@/components/home/best-sellers";
import { SizeGuideBanner } from "@/components/home/size-guide-banner";
import { Offers } from "@/components/home/offers";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { ChoosingGuide } from "@/components/home/choosing-guide";
import { BlogPreview } from "@/components/home/blog-preview";
import { HomepageFaq, HOMEPAGE_FAQS } from "@/components/home/homepage-faq";
import { HomepageIntro } from "@/components/home/homepage-intro";
import { faqJsonLd } from "@/lib/seo";

// Belt-and-braces alongside the on-demand revalidatePath() calls in
// lib/revalidate.ts (which fire immediately after an admin save): a ceiling
// so the page is never more than 5 minutes stale even if one is ever missed.
export const revalidate = 300;

export default function HomePage() {
  const faqSchema = faqJsonLd(HOMEPAGE_FAQS);

  // Order follows the reference comp: editorial hero, a quiet
  // trust line, photographic pet tiles, the carrier finder, then real stock
  // before any explanatory copy.
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Hero />
      <TrustBar />
      <ShopByPet />
      <div id="find-your-fit" className="scroll-mt-24">
        <CarrierFinder />
      </div>
      <BestSellers />
      <SizeGuideBanner />
      <Offers />
      <WhyChooseUs />
      <ChoosingGuide />
      <BlogPreview />
      <HomepageFaq />
      <HomepageIntro />
    </>
  );
}
