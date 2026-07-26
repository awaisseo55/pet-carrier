import { Hero } from "@/components/home/hero";
import { ShopMainCategories } from "@/components/home/shop-main-categories";
import { ShopByPet } from "@/components/home/shop-by-pet";
import { FeaturedProduct } from "@/components/home/featured-product";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { BlogPreview } from "@/components/home/blog-preview";
import { Newsletter } from "@/components/home/newsletter";

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
