/**
 * Curated Unsplash placeholder imagery, used for homepage, category and
 * blog visuals until real lifestyle photography is available. Product
 * images are downloaded from Amazon via the admin panel instead, see
 * lib/amazon.ts and lib/image-pipeline.ts.
 */

function unsplash(id: string, w = 1200, q = 80) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&auto=format&fit=crop`;
}

export const HERO_IMAGE = unsplash("1601758228041-f3b2795255f1", 1400);

export const CATEGORY_IMAGES = {
  dogs: unsplash("1583512603805-3cc6b41f3edb", 800),
  cats: unsplash("1543466835-00a7907e9de1", 800),
  "small-animals": unsplash("1594149929911-78975a43d4f5", 800),
  birds: unsplash("1425082661705-1834bfd09dca", 800),
} as const;

export const DOG_IMAGES = [
  unsplash("1601758228041-f3b2795255f1"),
  unsplash("1583512603805-3cc6b41f3edb"),
  unsplash("1444212477490-ca407925329e"),
  unsplash("1560807707-8cc77767d783"),
  unsplash("1595433707802-6b2626ef1c91"),
  unsplash("1583511655857-d19b40a7a54e"),
  unsplash("1552053831-71594a27632d"),
];

export const CAT_IMAGES = [
  unsplash("1543466835-00a7907e9de1"),
  unsplash("1548199973-03cce0bbc87b"),
  unsplash("1583337130417-3346a1be7dee"),
  unsplash("1601979031925-424e53b6caaa"),
  unsplash("1591561582301-7ce6588cc286"),
];

export const SMALL_ANIMAL_IMAGES = [
  unsplash("1594149929911-78975a43d4f5"),
  unsplash("1524704796725-9fc3044a58b2"),
  unsplash("1591946614720-90a587da4a36"),
  unsplash("1500462918059-b1a0cb512f1d"),
];

export const BIRD_IMAGES = [
  unsplash("1425082661705-1834bfd09dca"),
  unsplash("1425421669292-0c3da3b8f529"),
  unsplash("1452570053594-1b985d6ea890"),
  unsplash("1444464666168-49d633b86797"),
  unsplash("1591160690555-5debfba289f0"),
];

export const LIFESTYLE_IMAGES = {
  whyChoose1: unsplash("1595433707802-6b2626ef1c91", 700),
  whyChoose2: unsplash("1583337130417-3346a1be7dee", 700),
  whyChoose3: unsplash("1594149929911-78975a43d4f5", 700),
  newsletter: unsplash("1552053831-71594a27632d", 1200),
  about: unsplash("1601979031925-424e53b6caaa", 1200),
  blogFallback: unsplash("1560807707-8cc77767d783", 900),
};

export const IMAGES_BY_PET_TYPE = {
  dogs: DOG_IMAGES,
  cats: CAT_IMAGES,
  "small-animals": SMALL_ANIMAL_IMAGES,
  birds: BIRD_IMAGES,
};
