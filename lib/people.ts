import { slugify } from "./utils";

/**
 * Static author/reviewer registry for blog bylines and their profile pages.
 * Mirrors the code-configured pattern used for the category taxonomy
 * (lib/categories.ts): there's no admin CRUD for people, add an entry here
 * when a new byline is needed. Bios describe genuine practical experience,
 * never veterinary, clinical or academic credentials nobody on the team
 * holds, see CLAUDE.md's "never make unsupported claims" rule.
 */

export type PersonRole = "author" | "reviewer";

export interface ExperienceEntry {
  heading: string;
  text: string;
}

export interface Person {
  slug: string;
  name: string;
  title: string;
  role: PersonRole;
  shortBio: string;
  bio: string[]; // paragraphs
  expertise: string[];
  experience: ExperienceEntry[];
  editorialNoteHeading: string;
  editorialNote: string;
  profileUrl: string;
}

export const PEOPLE: Person[] = [
  {
    slug: "rebecca",
    name: "Rebecca",
    title: "Pet Care Specialist & Pet Writer",
    role: "author",
    shortBio:
      "Rebecca is a pet-care specialist and experienced pet writer with a practical background in the pet retail sector. She creates clear, useful guides covering pet travel, carriers and everyday pet-care considerations.",
    bio: [
      "Rebecca is the main pet-care writer for Pet Carrier, where she produces practical guides covering pet travel, carrier selection, everyday pet-care considerations and responsible preparation for journeys.",
      "Her interest in pet care developed through hands-on experience in the pet retail environment, where she spent time helping customers understand the differences between pet products and choose options suited to their animals, routines and travel requirements.",
      "Working directly with pet owners gave Rebecca an appreciation for the fact that there is rarely a single solution that works for every animal. A carrier that is suitable for one small dog may not be appropriate for another, while a nervous cat may have very different travel needs from a confident one.",
      "Rather than focusing only on product features, Rebecca's articles explain why particular features may matter and what pet owners should consider before making a decision. Her guides aim to answer common questions about sizing, ventilation, comfort, portability, preparation, cleaning and safe travel.",
      "At Pet Carrier, Rebecca writes for everyday UK pet owners, including people preparing for vet visits, car journeys, holidays, public transport trips and other situations where a suitable carrier or travel accessory may be required. She avoids unnecessary jargon and aims to make each guide useful to someone who may have little previous experience with pet carriers or pet travel.",
    ],
    expertise: [
      "Pet Carrier Selection",
      "Pet Travel Preparation",
      "Dog Travel",
      "Cat Travel",
      "Small Animal Travel",
      "Pet Comfort During Journeys",
      "Carrier Size & Fit",
      "Carrier Features & Materials",
      "Pet Travel Accessories",
      "Everyday Pet Product Guidance",
      "Pet Carrier Care & Cleaning",
      "Practical Pet Owner Guides",
    ],
    experience: [
      {
        heading: "Pet Retail Experience",
        text: "Rebecca has practical experience working in the pet retail environment, helping pet owners compare products and understand which features may be useful for different animals and situations.",
      },
      {
        heading: "Pet Product Guidance",
        text: "Through her experience working with pet owners, Rebecca developed a practical understanding of common questions surrounding carriers, travel accessories, comfort and everyday pet products.",
      },
      {
        heading: "Pet-Care Writing",
        text: "Rebecca now uses that practical experience to create accessible pet-care content for Pet Carrier, focusing on useful explanations rather than generic product descriptions.",
      },
      {
        heading: "UK Pet Owner Focus",
        text: "Her content is written with UK pet owners in mind, particularly those looking for practical guidance about travelling with dogs, cats and smaller companion animals.",
      },
    ],
    editorialNoteHeading: "Rebecca's Editorial Approach",
    editorialNote:
      "Rebecca focuses on practical, reader-first pet-care information. Her articles aim to explain what pet owners should consider before choosing a carrier or preparing an animal for travel. She uses clear explanations, practical checklists and comparisons where they help readers make decisions. Articles avoid unnecessary product promotion and clearly distinguish general guidance from situations where readers may need advice from a qualified veterinary professional or their transport provider.",
    profileUrl: "/author/rebecca",
  },
  {
    slug: "daniel",
    name: "Daniel",
    title: "Pet Care Reviewer & Editorial Reviewer",
    role: "reviewer",
    shortBio:
      "Daniel reviews Pet Carrier content for clarity, practical usefulness and responsible presentation, helping readers understand pet-care and travel guidance.",
    bio: [
      "Daniel is an editorial reviewer for Pet Carrier, where he reviews pet-care and pet-travel articles before publication or significant updates.",
      "His role focuses on reviewing content from a practical reader's perspective and checking that recommendations are clearly explained, relevant to the topic and presented responsibly.",
      "Daniel pays particular attention to areas such as pet travel preparation, carrier features, practical safety considerations, product-selection guidance and the clarity of instructions provided to readers.",
      "As an editorial reviewer, Daniel helps identify unclear statements, missing context and recommendations that could be misunderstood by readers. He also checks that articles distinguish between general pet-care information and situations where readers should seek advice from an appropriately qualified professional.",
      "Daniel's reviewing role complements Rebecca's writing. Rebecca is responsible for producing the main article, while Daniel provides an additional editorial review before publication or substantial updates. This two-person editorial process is intended to make Pet Carrier's content clearer, more useful and more responsible for everyday pet owners.",
    ],
    expertise: [
      "Pet Travel Content Review",
      "Pet Carrier Guidance",
      "Pet Travel Preparation",
      "Practical Pet Safety",
      "Product Feature Review",
      "Pet Owner Education",
      "Editorial Accuracy",
      "Content Clarity",
      "Responsible Pet-Care Communication",
      "UK Pet Travel Information",
    ],
    experience: [
      {
        heading: "Editorial Review",
        text: "Daniel reviews Pet Carrier articles for clarity, usefulness and responsible presentation before publication or substantial updates.",
      },
      {
        heading: "Pet-Care Content Review",
        text: "He focuses on articles covering pet carriers, travel preparation, product features and everyday pet-care guidance.",
      },
      {
        heading: "Practical Content Checking",
        text: "Daniel looks for unclear instructions, unsupported claims, missing context and recommendations that may need additional explanation.",
      },
      {
        heading: "Reader-First Review",
        text: "His objective is to ensure that readers can understand the advice and know what practical steps they can take.",
      },
    ],
    editorialNoteHeading: "Daniel's Editorial Review Role",
    editorialNote:
      "Daniel reviews Pet Carrier articles for practical clarity, responsible presentation and reader usefulness. His review may include checking whether the article clearly answers the reader's question, whether recommendations are explained properly, whether important practical considerations have been included, whether instructions are easy to understand, whether claims are presented appropriately, whether safety-related information is communicated responsibly, and whether readers are directed to qualified professionals or the relevant transport provider when appropriate. Daniel's review does not replace veterinary advice or official transport guidance.",
    profileUrl: "/reviewer/daniel",
  },
];

export function getPersonBySlug(slug: string, role?: PersonRole): Person | undefined {
  return PEOPLE.find((p) => p.slug === slug && (!role || p.role === role));
}

export function getPersonByName(name: string, role?: PersonRole): Person | undefined {
  const slug = slugify(name);
  return getPersonBySlug(slug, role);
}

export function personSlug(name: string): string {
  return slugify(name);
}

export function authors(): Person[] {
  return PEOPLE.filter((p) => p.role === "author");
}

export function reviewers(): Person[] {
  return PEOPLE.filter((p) => p.role === "reviewer");
}
