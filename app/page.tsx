import { Hero } from "@/components/home/hero";
import { ShopByPet } from "@/components/home/shop-by-pet";
import { FeaturedProducts } from "@/components/home/featured-products";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { BlogPreview } from "@/components/home/blog-preview";
import { Newsletter } from "@/components/home/newsletter";
import { Testimonials } from "@/components/home/testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ShopByPet />
      <FeaturedProducts />
      <WhyChooseUs />
      <BlogPreview />
      <Newsletter />
      <Testimonials />
    </>
  );
}
