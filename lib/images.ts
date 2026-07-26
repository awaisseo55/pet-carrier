/**
 * Curated Unsplash placeholder imagery, used for homepage, category and
 * blog visuals until real lifestyle photography or admin-uploaded images
 * are available. Every URL below has been visually verified to actually
 * show the animal it's used for, not just checked for a 200 response,
 * after an earlier mismatch (dogs/hamsters showing up under cat/bird
 * categories, and one image with a competitor's logo visible). See
 * lib/placeholders.ts for the fallback resolution order (admin upload ->
 * curated Unsplash -> generic placeholder).
 */

function unsplash(id: string, w = 1200, q = 80) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&auto=format&fit=crop`;
}

// A pug settled into a stylish grey carrier bed with tan leather trim,
// no visible logos or text.
export const HERO_IMAGE = unsplash("1591768795000-25df3bf6620a", 1400);

export const CATEGORY_IMAGES = {
  dogs: unsplash("1583512603805-3cc6b41f3edb", 800),
  cats: unsplash("1761614282055-29e039aac354", 800),
  "small-animals": unsplash("1658938821244-b2f28b7756eb", 800),
  birds: unsplash("1452570053594-1b985d6ea890", 800),
} as const;

export const DOG_IMAGES = [
  unsplash("1583512603805-3cc6b41f3edb"), // french bulldog puppy, yellow background
  unsplash("1444212477490-ca407925329e"), // three puppies outdoors
  unsplash("1583511655857-d19b40a7a54e"), // french bulldog puppy, blue background
  unsplash("1591768795000-25df3bf6620a"), // pug in a stylish carrier bed
  unsplash("1765045952615-9e28d239f053"), // yorkie peeking out of a carrier
];

export const CAT_IMAGES = [
  unsplash("1761614282055-29e039aac354"), // cat in a wheeled carrier
  unsplash("1565029400423-ec64047d5f07"), // cat resting beside a carrier bag
  unsplash("1765182272682-c1e8edf6251e"), // cat peeking out of a woven bag
  unsplash("1595433707802-6b2626ef1c91"), // kitten portrait
];

export const SMALL_ANIMAL_IMAGES = [
  unsplash("1658938821244-b2f28b7756eb"), // two guinea pigs eating
  unsplash("1658938822127-44b96082ddf6"), // two guinea pigs
  unsplash("1612267168669-679c961c5b31"), // three guinea pigs
  unsplash("1585110396000-c9ffd4e4b308"), // white rabbit
  unsplash("1591561582301-7ce6588cc286"), // white rabbit, close up
];

export const BIRD_IMAGES = [
  unsplash("1452570053594-1b985d6ea890"), // blue and gold macaw
  unsplash("1444464666168-49d633b86797"), // kingfisher
  unsplash("1552728089-57bdde30beb3"), // green parakeet
];

export const LIFESTYLE_IMAGES = {
  whyChoose1: unsplash("1595433707802-6b2626ef1c91", 700), // kitten
  whyChoose2: unsplash("1583512603805-3cc6b41f3edb", 700), // dog
  whyChoose3: unsplash("1658938821244-b2f28b7756eb", 700), // guinea pigs
  newsletter: unsplash("1552053831-71594a27632d", 1200), // dog with a flower
  about: unsplash("1565029400423-ec64047d5f07", 1200), // cat resting by a carrier
  blogFallback: unsplash("1560807707-8cc77767d783", 900), // spaniel puppy
};

export const IMAGES_BY_PET_TYPE = {
  dogs: DOG_IMAGES,
  cats: CAT_IMAGES,
  "small-animals": SMALL_ANIMAL_IMAGES,
  birds: BIRD_IMAGES,
};
