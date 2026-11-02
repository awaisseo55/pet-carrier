"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getCategoryByPath } from "@/lib/categories";

/**
 * "A good fit starts here" finder. Three plain-language questions that route
 * to the most specific category page that actually exists, rather than to a
 * new search URL: every destination below is an existing category route, so
 * this adds a front door to the catalogue without inventing any new URLs.
 *
 * Candidate paths are tried most-specific first and the first one that exists
 * in `CATEGORIES` wins, so a missing sub-category quietly falls back to its
 * hub instead of 404ing.
 */

const PETS = [
  { value: "dog", label: "Dog", hub: "carriers/dog-carriers" },
  { value: "cat", label: "Cat", hub: "carriers/cat-carriers" },
  { value: "small", label: "Small pet", hub: "carriers/small-animal-carriers" },
  { value: "bird", label: "Bird", hub: "carriers/bird-carriers" },
] as const;

const SIZES = [
  { value: "puppy", label: "Puppy or kitten" },
  { value: "small", label: "Small, up to 7kg" },
  { value: "medium", label: "Medium, 7 to 15kg" },
  { value: "large", label: "Large, over 15kg" },
] as const;

const JOURNEYS = [
  { value: "everyday", label: "Everyday trips" },
  { value: "car", label: "Car travel" },
  { value: "flight", label: "Flying in the cabin" },
  { value: "vet", label: "Vet visits" },
  { value: "walk", label: "Walks and hikes" },
] as const;

type Pet = (typeof PETS)[number]["value"];
type Size = (typeof SIZES)[number]["value"];
type Journey = (typeof JOURNEYS)[number]["value"];

/** Most specific first. The first path that exists as a category wins. */
function candidatePaths(pet: Pet, size: Size, journey: Journey): string[] {
  const hub = PETS.find((p) => p.value === pet)!.hub;
  const out: string[] = [];

  if (pet === "dog") {
    if (journey === "flight") out.push("carriers/dog-carriers/airline-approved-dog-carriers");
    if (journey === "car") out.push("carriers/dog-carriers/dog-car-carriers");
    if (journey === "walk") out.push("carriers/dog-carriers/hiking-dog-carriers");
    if (size === "puppy") out.push("carriers/dog-carriers/puppy-carriers");
    if (size === "small") out.push("carriers/dog-carriers/small-dog-carriers");
    if (size === "medium") out.push("carriers/dog-carriers/medium-dog-carriers");
    if (size === "large") out.push("carriers/dog-carriers/large-dog-carriers");
  }

  if (pet === "cat") {
    if (journey === "flight") out.push("carriers/cat-carriers/airline-approved-cat-carriers");
    if (size === "puppy") out.push("carriers/cat-carriers/kitten-carriers");
    if (size === "large") out.push("carriers/cat-carriers/large-cat-carriers");
  }

  // Cross-pet collections, used when nothing species-specific fits.
  if (journey === "flight") out.push("carriers/pet-airline-approved-carriers");
  if (journey === "car") out.push("carriers/pet-car-travel-carriers");
  if (journey === "vet") out.push("carriers/pet-carriers-for-vet-visits");
  if (journey === "walk") out.push("carriers/hiking-pet-carriers");
  if (journey === "everyday") out.push("carriers/everyday-pet-carriers");

  out.push(hub, "carriers");
  return out;
}

const selectClass =
  "w-full appearance-none rounded-xl border border-forest-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-ink shadow-sm outline-none transition-colors focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/30";

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-forest-700"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CarrierFinder() {
  const router = useRouter();
  const [pet, setPet] = React.useState<Pet>("dog");
  const [size, setSize] = React.useState<Size>("small");
  const [journey, setJourney] = React.useState<Journey>("everyday");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = candidatePaths(pet, size, journey).find((path) => getCategoryByPath(path));
    router.push(`/${match ?? "carriers"}`);
  }

  return (
    <section className="bg-background px-4 pb-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-forest-100">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 items-center gap-8 p-8 sm:p-10 lg:grid-cols-12 lg:gap-10 lg:p-12"
        >
          <div className="lg:col-span-4">
            <h2 className="text-3xl leading-[1.08] text-forest-800 sm:text-4xl">
              A good fit
              <br />
              starts here.
            </h2>
            <span className="mt-4 block h-[3px] w-16 rounded-full bg-ember-500" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-forest-800/70">
              Three questions, and we will point you at the right part of the range.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-[0.1em] text-forest-800/70 uppercase">
                Pet
              </span>
              <span className="relative block">
                <select
                  value={pet}
                  onChange={(e) => setPet(e.target.value as Pet)}
                  className={selectClass}
                >
                  {PETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <Chevron />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-[0.1em] text-forest-800/70 uppercase">
                Size
              </span>
              <span className="relative block">
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as Size)}
                  className={selectClass}
                >
                  {SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Chevron />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold tracking-[0.1em] text-forest-800/70 uppercase">
                Journey
              </span>
              <span className="relative block">
                <select
                  value={journey}
                  onChange={(e) => setJourney(e.target.value as Journey)}
                  className={selectClass}
                >
                  {JOURNEYS.map((j) => (
                    <option key={j.value} value={j.value}>
                      {j.label}
                    </option>
                  ))}
                </select>
                <Chevron />
              </span>
            </label>

            <div className="sm:col-span-3 sm:flex sm:justify-end">
              <button
                type="submit"
                className="w-full cursor-pointer rounded-xl bg-forest-800 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-900 hover:shadow-md sm:w-auto"
              >
                Find my carrier
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
