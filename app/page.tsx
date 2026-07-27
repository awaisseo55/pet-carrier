import { Hero } from "@/components/home/hero";
import { ShopMainCategories } from "@/components/home/shop-main-categories";
import { ShopByPet } from "@/components/home/shop-by-pet";
import { FeaturedProduct } from "@/components/home/featured-product";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { BlogPreview } from "@/components/home/blog-preview";
import { Newsletter } from "@/components/home/newsletter";

// Belt-and-braces alongside the on-demand revalidatePath() calls in
// lib/revalidate.ts (which fire immediately after an admin save): a ceiling
// so the page is never more than 5 minutes stale even if one is ever missed.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero />
      <ShopMainCategories />
      <ShopByPet />
      <FeaturedProduct />
      <WhyChooseUs />
      <BlogPreview />
      <Newsletter />
    </>
  );
}
