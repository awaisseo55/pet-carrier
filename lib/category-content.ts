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
  strollers: "stroller",
  beds: "bed",
};

const SECTION_VERB: Record<Section, string> = {
  carriers: "travel",
  strollers: "get out and about",
  beds: "rest and recover",
};

function singularName(node: CategoryNode): string {
  // "Puppy Carriers" -> "puppy carrier", "Dog Beds" -> "dog bed"
  const noun = SECTION_NOUN[node.section];
  const lower = lowerName(node.name);
  const plural = `${noun}s`;
  if (lower.endsWith(plural)) {
    return `${lower.slice(0, -plural.length - 1)} ${noun}`;
  }
  return lower.replace(/s$/, "");
}

export function getMetaTitle(node: CategoryNode): string {
  return node.name.length <= 60 ? node.name : `${node.name.slice(0, 57)}...`;
}

export function getMetaDescription(node: CategoryNode): string {
  const noun = singularName(node);
  const text = `Shop ${lowerName(node.name)} for ${node.descriptor}. Free UK shipping over £50, 30-day returns. Find the right ${noun} for your pet.`;
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
    strollers: [
      `A stroller matched to ${node.descriptor} rides more smoothly and steers more predictably than a generic option. That matters on kerbs, in busy areas, and anywhere you need to manoeuvre without a fight.`,
      `Picking a stroller designed around ${node.descriptor} means the frame, wheels and harness are all sized appropriately, rather than being a compromise that never quite feels right.`,
    ],
    beds: [
      `A bed designed for ${node.descriptor} supports the body properly, which matters more than it might seem for a good night's sleep or a restful afternoon nap.`,
      `Getting the right bed for ${node.descriptor} isn't just about comfort on the surface, it's about the right level of support and warmth underneath too.`,
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

  if (node.section === "beds") {
    return `The right size ${noun} gives your pet room to stretch out fully and still turn around comfortably. As a rough guide, measure your pet lying down at full length and add a little extra room on top, rather than sizing too tightly. For ${node.descriptor}, pay attention to the product's weight guidance as well as its dimensions, since some beds are built with a specific level of support in mind. If your pet tends to sleep curled up, a slightly smaller bed with raised sides can feel cosier, while pets who stretch out fully generally do better with a flatter, more open design.`;
  }

  if (node.section === "strollers") {
    return `Check both the maximum weight capacity and the internal compartment dimensions before buying, since strollers are often limited by one or the other. For ${node.descriptor}, it's worth measuring your pet from nose to tail and checking their current weight against the product listing, leaving a little extra room to grow if you have a younger pet. Wheel size and frame width also matter if you'll be using pavements, gravel paths or need to fold the stroller down for the car.`;
  }

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
      answer: `Prices vary depending on size, material and features. As a general guide, expect to pay more for hard-sided or heavier-duty options than for simple soft-sided designs. Free UK shipping applies on all orders over £50.`,
    },
    {
      question: `Do you offer free UK delivery on ${namePlural}?`,
      answer: `Yes, orders over £50 qualify for free standard UK shipping. Orders under £50 have a small delivery charge shown at checkout. We also offer 30-day returns if something isn't quite right.`,
    },
  ];

  return faqs;
}
