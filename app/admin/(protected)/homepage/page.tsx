import { getHeroImageUrl } from "@/lib/placeholders";
import { getHomepageSettings } from "@/lib/homepage";
import { getAllProducts } from "@/lib/products";
import { HeroImageUpload } from "@/components/admin/hero-image-upload";
import { HomepageSettingsForm } from "@/components/admin/homepage-settings-form";

export default async function AdminHomepagePage() {
  const [hero, settings, products] = await Promise.all([
    getHeroImageUrl(),
    getHomepageSettings(),
    getAllProducts(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Homepage</h1>
      <p className="mt-1 text-gray-500">
        Recommended hero image size 2000 x 1200 or larger. Until you upload one, a curated default hero photo is
        shown.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="max-w-md">
          <HeroImageUpload url={hero.url} isCustom={hero.isCustom} />
        </div>
        <HomepageSettingsForm settings={settings} products={products} />
      </div>
    </div>
  );
}
