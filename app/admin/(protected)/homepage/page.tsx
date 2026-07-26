import { getHeroImageUrl } from "@/lib/placeholders";
import { HeroImageUpload } from "@/components/admin/hero-image-upload";

export default async function AdminHomepagePage() {
  const hero = await getHeroImageUrl();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Homepage</h1>
      <p className="mt-1 text-brown-soft">
        Recommended size 1600 x 1200 or larger. Until you upload one, a curated default hero photo
        is shown.
      </p>

      <div className="mt-6 max-w-md">
        <HeroImageUpload url={hero.url} isCustom={hero.isCustom} />
      </div>
    </div>
  );
}
