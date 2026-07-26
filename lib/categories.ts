import type { PetType, Subcategory, TravelType } from "./types";

export interface SubcategoryDef {
  value: Subcategory;
  label: string;
}

export interface CategoryDef {
  value: PetType;
  label: string;
  description: string;
  subcategories: SubcategoryDef[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    value: "dogs",
    label: "Dogs",
    description:
      "Soft-sided, wheeled and hard-shell carriers built for dogs of every size, from lap dogs to larger breeds on longer journeys.",
    subcategories: [
      { value: "puppies", label: "Puppies" },
      { value: "small-dogs", label: "Small Dogs (under 10kg)" },
      { value: "medium-dogs", label: "Medium Dogs (10 to 25kg)" },
      { value: "large-dogs", label: "Large Dogs (over 25kg)" },
    ],
  },
  {
    value: "cats",
    label: "Cats",
    description:
      "Calm, secure carriers designed to keep nervous cats settled, with top-loading options and enclosed designs.",
    subcategories: [
      { value: "kittens", label: "Kittens" },
      { value: "adult-cats", label: "Adult Cats" },
      { value: "large-cats", label: "Large Cats" },
    ],
  },
  {
    value: "small-animals",
    label: "Small Animals",
    description:
      "Well-ventilated carriers sized for rabbits, guinea pigs, hamsters and other small pets, built for short, low-stress trips.",
    subcategories: [
      { value: "rabbits", label: "Rabbits" },
      { value: "guinea-pigs", label: "Guinea Pigs" },
      { value: "hamsters", label: "Hamsters" },
      { value: "ferrets", label: "Ferrets" },
    ],
  },
  {
    value: "birds",
    label: "Birds",
    description:
      "Travel cages and soft carriers for small to medium birds, with secure perches and thoughtful ventilation.",
    subcategories: [
      { value: "budgies-small-birds", label: "Budgies & Small Birds" },
      { value: "parrots-large-birds", label: "Parrots & Large Birds" },
    ],
  },
];

export const TRAVEL_TYPES: { value: TravelType; label: string }[] = [
  { value: "airline-approved", label: "Airline Approved" },
  { value: "car-travel", label: "Car Travel" },
  { value: "public-transport", label: "Public Transport" },
  { value: "backpack-hiking", label: "Backpack / Hiking" },
  { value: "vet-visits", label: "Vet Visits" },
];

export function getCategory(value: PetType): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.value === value);
}

export function getSubcategoryLabel(value: Subcategory): string {
  for (const category of CATEGORIES) {
    const match = category.subcategories.find((s) => s.value === value);
    if (match) return match.label;
  }
  return value;
}
