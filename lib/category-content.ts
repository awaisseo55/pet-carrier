import type { CategoryNode, Section } from "./categories";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

function lowerName(name: string): string {
  return name.toLowerCase();
}

const SECTION_NOUN: Record<Section, string> = {
  carriers: "carrier",
};

const SECTION_VERB: Record<Section, string> = {
  carriers: "travel",
};

function singularName(node: CategoryNode): string {
  // "Puppy Carriers" -> "puppy carrier", "Dog Beds" -> "dog bed"
  const noun = SECTION_NOUN[node.section];
  const lower = lowerName(node.name);
  const plural = `${noun}s`;
  if (lower.endsWith(plural)) {
    const prefix = lower.slice(0, -plural.length - 1);
    return prefix ? `${prefix} ${noun}` : noun;
  }
  return lower.replace(/s$/, "");
}

/**
 * Hand-authored meta titles for every built-in category, keyed by path.
 * The bare category name alone (e.g. "Dog Carriers") is too thin for search
 * or AI-answer-engine ranking, it wastes most of the ~60-character budget
 * and reads as generic. Each entry below leads with the primary keyword and
 * adds a short, genuine qualifier (size, use, material) rather than padding
 * with filler. Admin-added custom categories (not in this table) fall back
 * to the plain node.name below.
 */
const CATEGORY_META_TITLES: Record<string, string> = {
  carriers: "Pet Carriers for Dogs, Cats, Small Animals & Birds",
  "carriers/dog-carriers": "Dog Carriers: Comfortable Options for Every Size",
  "carriers/dog-carriers/puppy-carriers": "Puppy Carriers for Growing, Curious Pups",
  "carriers/dog-carriers/puppy-slings": "Puppy Sling Carriers | Soft & Safe Dog Carrying Slings",
  "carriers/dog-carriers/puppy-bike-carriers": "Puppy Bike Carriers for Secure Rides on Wheels",
  "carriers/dog-carriers/small-dog-carriers": "Small Dog Carriers for Dogs Up to 10kg",
  "carriers/dog-carriers/medium-dog-carriers": "Medium Dog Carriers for Dogs 10 to 25kg",
  "carriers/dog-carriers/large-dog-carriers": "Large Dog Carriers for Dogs Over 25kg",
  "carriers/dog-carriers/dog-slings": "Dog Slings for Holding Your Dog Close",
  "carriers/dog-carriers/dog-backpack-carriers": "Dog Backpack Carriers for Hands-Free Walks",
  "carriers/dog-carriers/airline-approved-dog-carriers": "Airline Approved Dog Carriers for Cabin Travel",
  "carriers/dog-carriers/dog-car-carriers": "Dog Car Carriers for Safe, Secure Journeys",
  "carriers/dog-carriers/dog-bike-carriers": "Dog Bike Carriers for Rides with Your Dog",
  "carriers/dog-carriers/hiking-dog-carriers": "Hiking Dog Carriers for Longer Walks",
  "carriers/dog-carriers/rolling-dog-carriers": "Rolling Dog Carriers with Wheels",
  "carriers/cat-carriers": "Cat Carriers: Calm, Secure Travel for Cats",
  "carriers/cat-carriers/kitten-carriers": "Kitten Carriers for Young, Nervous Kittens",
  "carriers/cat-carriers/soft-sided-cat-carriers": "Soft-Sided Cat Carriers, Light & Foldable",
  "carriers/cat-carriers/hard-sided-cat-carriers": "Hard-Sided Cat Carriers for Extra Protection",
  "carriers/cat-carriers/cat-backpack-carriers": "Cat Backpack Carriers for Hands-Free Trips",
  "carriers/cat-carriers/airline-approved-cat-carriers": "Airline Approved Cat Carriers for Cabin Travel",
  "carriers/cat-carriers/cat-slings": "Cat Sling Carriers - Comfortable & Secure Cat Slings",
  "carriers/cat-carriers/large-cat-carriers": "Large Cat Carriers for Bigger Cat Breeds",
  "carriers/small-animal-carriers": "Small Animal Carriers for Rabbits, Guinea Pigs & More",
  "carriers/small-animal-carriers/rabbit-carriers": "Rabbit Carriers with Ventilated, Secure Bases",
  "carriers/small-animal-carriers/guinea-pig-carriers": "Guinea Pig Carriers for Short, Safe Trips",
  "carriers/small-animal-carriers/hamster-carriers": "Hamster Carriers for Small Pet Rodents",
  "carriers/small-animal-carriers/ferret-carriers": "Ferret Carriers, Secure & Escape-Proof",
  "carriers/small-animal-carriers/reptile-carriers": "Reptile Carriers for Warm, Secure Transport",
  "carriers/bird-carriers": "Bird Carriers for Budgies, Parrots & Pet Birds",
  "carriers/bird-carriers/budgie-travel-cages": "Budgie Travel Cages for Small Pet Birds",
  "carriers/bird-carriers/parrot-travel-cages": "Parrot Travel Cages with Room to Perch",
  "carriers/bird-carriers/small-bird-carriers": "Small Bird Carriers for Short, Calm Trips",
  "carriers/hiking-pet-carriers": "Hiking Pet Carriers for Longer Walks Outdoors",
};

export function getMetaTitle(node: CategoryNode): string {
  const curated = CATEGORY_META_TITLES[node.path];
  if (curated) return curated;
  return node.name.length <= 60 ? node.name : `${node.name.slice(0, 57)}...`;
}

export function getMetaDescription(node: CategoryNode): string {
  const noun = singularName(node);
  const text = `Shop ${lowerName(node.name)} for ${node.descriptor}. Free UK shipping over £70, 14-day returns. Find the right ${noun} for your pet.`;
  return text.length <= 155 ? text : `${text.slice(0, 152)}...`;
}

export function getIntro(node: CategoryNode): string {
  const noun = singularName(node);
  const verb = SECTION_VERB[node.section];

  const openers = [
    `Looking for ${lowerName(node.name)}? This is exactly the right place to start. Every ${noun} in this range is chosen with ${node.descriptor} in mind, so you can shop with confidence rather than guessing whether something will actually fit.`,
    `${node.name} need to do one job well: help your pet ${verb} without stress. Here you'll find options built specifically for ${node.descriptor}, so you're not stuck comparing generic products that don't quite fit the brief.`,
    `Choosing the right ${noun} makes a real difference, especially for ${node.descriptor}. This category brings together options suited to exactly that, so you can compare like for like rather than sifting through everything at once.`,
  ];

  const middles = [
    `A well-chosen ${noun} should feel secure without feeling restrictive. That balance matters more than it might seem: too loose and your pet can feel unsteady, too tight and even short trips become uncomfortable. We've kept that balance in mind when curating this range.`,
    `Materials, ventilation and closures all matter here. A ${noun} that looks the part in photos but skimps on airflow or has a flimsy closure will let you down exactly when you need it most, so these details are worth paying attention to before you buy.`,
    `Comfort, safety and practicality all need to work together for this category. It's not just about picking the first option that looks nice, it's about finding something that will genuinely hold up to regular use.`,
  ];

  const closers = [
    `Browse the range below, and if you're not sure where to start, our sizing and buying guide further down this page walks through exactly what to look for.`,
    `Take a look through what's available below. If you need a hand deciding between options, the buying guide and FAQ further down cover the questions we hear most often.`,
    `Have a browse below. We've also put together a short buying guide and some frequently asked questions further down the page if you want more detail before deciding.`,
  ];

  return [pick(openers, `${node.path}-o`), pick(middles, `${node.path}-m`), pick(closers, `${node.path}-c`)].join(
    "\n\n"
  );
}

export function getWhyChoose(node: CategoryNode): string {
  const noun = singularName(node);

  const reasons: Record<string, string[]> = {
    carriers: [
      `A dedicated ${noun} is built around the specific needs of ${node.descriptor}, rather than trying to be everything for everyone. That focus tends to show in the small details: where the ventilation sits, how the closures work, and how the weight is distributed when you're carrying it.`,
      `Choosing a ${noun} suited to ${node.descriptor} usually means less fuss on the day. Your pet settles faster because the space actually fits them properly, and you're not wrestling with a carrier that's either too roomy to feel secure or too snug to be comfortable.`,
    ],
  };

  const list = reasons[node.section];
  const first = pick(list, `${node.path}-why1`);
  const second = list[(list.indexOf(first) + 1) % list.length];

  const practical = `On the practical side, look for a product with a UK based seller so returns and questions are straightforward, materials that are easy to wipe down or wash, and clear size guidance rather than vague descriptions. These are the things that make the difference between something you reach for often and something that sits unused in a cupboard.`;

  return [first, second, practical].join("\n\n");
}

export function getSizingGuide(node: CategoryNode): string {
  const noun = singularName(node);

  return `Getting the size right matters more than almost anything else with a ${noun}. Measure your pet from nose to the base of the tail for length, floor to the top of the head or ears for height, and across the shoulders for width, then check these against the product's stated dimensions rather than relying on breed alone. For ${node.descriptor}, a slightly snugger fit is often more reassuring than a very loose one, since most pets feel calmer in an enclosed space that moves with them rather than a large one that shifts around. Always check the maximum weight capacity too, since this can be the limiting factor even when the dimensions look right.`;
}

export function getFaqs(node: CategoryNode): { question: string; answer: string }[] {
  const noun = singularName(node);
  const namePlural = lowerName(node.name);

  const faqs: { question: string; answer: string }[] = [
    {
      question: `What size ${noun} do I need?`,
      answer: `Measure your pet's length, height and weight, then compare this against the specific dimensions and weight capacity listed on each product, rather than relying on breed or age alone. This matters especially for ${node.descriptor}, since sizing can vary a fair bit between individual pets.`,
    },
    {
      question: `Are ${namePlural} suitable for ${node.animal === "multiple pets" ? "most pets" : `${node.animal}s`}?`,
      answer: `This category is curated specifically for ${node.descriptor}, so everything listed here has been chosen with that use in mind. If you're unsure whether a particular product suits your pet, check the specifications table on the product page or get in touch before ordering.`,
    },
    {
      question: `How do I clean a ${noun}?`,
      answer: `Most products in this range have wipeable outer material and a removable, washable liner or cushion. Always check the specific care instructions on the product page, since materials and washing guidance can vary between items.`,
    },
    {
      question: `How much do ${namePlural} cost?`,
      answer: `Prices vary depending on size, material and features. As a general guide, expect to pay more for hard-sided or heavier-duty options than for simple soft-sided designs. Free UK shipping applies on all orders over £70.`,
    },
    {
      question: `Do you offer free UK delivery on ${namePlural}?`,
      answer: `Yes, orders over £70 qualify for free standard UK shipping. Orders under £70 have a small delivery charge shown at checkout. We also offer 14-day returns if something isn't quite right.`,
    },
  ];

  return faqs;
}
