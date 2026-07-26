"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PET_TYPES } from "@/lib/constants";
import { CATEGORIES, TRAVEL_TYPES } from "@/lib/categories";
import type { PetType, Product, Subcategory, TravelType } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRICE_BANDS = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under £30", min: 0, max: 30 },
  { label: "£30 to £50", min: 30, max: 50 },
  { label: "£50 to £75", min: 50, max: 75 },
  { label: "Over £75", min: 75, max: Infinity },
];

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "title", label: "Name: A to Z" },
];

export function ShopClient({
  products,
  lockedCategory,
}: {
  products: Product[];
  lockedCategory?: PetType;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [petTypes, setPetTypes] = React.useState<PetType[]>(lockedCategory ? [lockedCategory] : []);
  const [subcategories, setSubcategories] = React.useState<Subcategory[]>([]);
  const [travelTypes, setTravelTypes] = React.useState<TravelType[]>([]);
  const [priceBand, setPriceBand] = React.useState(0);
  const [sort, setSort] = React.useState("featured");
  const [query, setQuery] = React.useState(initialQuery);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  function togglePetType(type: PetType) {
    setPetTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function toggleSubcategory(value: Subcategory) {
    setSubcategories((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  }

  function toggleTravelType(value: TravelType) {
    setTravelTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  const visibleCategories = lockedCategory
    ? CATEGORIES.filter((c) => c.value === lockedCategory)
    : petTypes.length > 0
      ? CATEGORIES.filter((c) => petTypes.includes(c.value))
      : CATEGORIES;

  const filtered = React.useMemo(() => {
    const band = PRICE_BANDS[priceBand];
    let list = products.filter((p) => {
      if (petTypes.length > 0 && !petTypes.includes(p.pet_type)) return false;
      if (subcategories.length > 0 && (!p.subcategory || !subcategories.includes(p.subcategory))) return false;
      if (travelTypes.length > 0) {
        const productTravel = p.travel_types || [];
        if (!travelTypes.some((t) => productTravel.includes(t))) return false;
      }
      if (p.price < band.min || p.price > band.max) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.short_description.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [products, petTypes, subcategories, travelTypes, priceBand, query, sort]);

  const activeFilterCount =
    (lockedCategory ? 0 : petTypes.length) + subcategories.length + travelTypes.length + (priceBand > 0 ? 1 : 0);

  const filterPanel = (
    <div className="flex flex-col gap-8">
      {!lockedCategory && (
        <div>
          <h3 className="font-medium text-foreground">Pet Type</h3>
          <div className="mt-3 flex flex-col gap-2.5">
            {PET_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={petTypes.includes(type.value)}
                  onCheckedChange={() => togglePetType(type.value)}
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-medium text-foreground">Size &amp; Life Stage</h3>
        <div className="mt-3 flex flex-col gap-4">
          {visibleCategories.map((category) => (
            <div key={category.value}>
              {!lockedCategory && visibleCategories.length > 1 && (
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category.label}
                </p>
              )}
              <div className="flex flex-col gap-2.5">
                {category.subcategories.map((sub) => (
                  <label key={sub.value} className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={subcategories.includes(sub.value)}
                      onCheckedChange={() => toggleSubcategory(sub.value)}
                    />
                    <span className="text-sm">{sub.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-foreground">Travel Type</h3>
        <div className="mt-3 flex flex-col gap-2.5">
          {TRAVEL_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={travelTypes.includes(type.value)}
                onCheckedChange={() => toggleTravelType(type.value)}
              />
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-foreground">Price</h3>
        <div className="mt-3 flex flex-col gap-2.5">
          {PRICE_BANDS.map((band, index) => (
            <label key={band.label} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="price-band"
                checked={priceBand === index}
                onChange={() => setPriceBand(index)}
                className="size-4 accent-sage-600"
              />
              <span className="text-sm">{band.label}</span>
            </label>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={() => {
            if (!lockedCategory) setPetTypes([]);
            setSubcategories([]);
            setTravelTypes([]);
            setPriceBand(0);
          }}
          className="text-left text-sm font-medium text-sage-700 hover:underline cursor-pointer"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-6">
          {filterPanel}
        </div>
      </aside>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-6 pb-6">{filterPanel}</div>
              </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground">
              {filtered.length} carrier{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="text-sm text-muted-foreground whitespace-nowrap">
              Sort by
            </Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger id="sort" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {query && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Results for &ldquo;{query}&rdquo;</span>
            <button
              onClick={() => setQuery("")}
              className={cn("flex items-center gap-1 text-sage-700 hover:underline cursor-pointer")}
            >
              <X className="size-3" /> Clear
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-cream-dark/40 py-16 text-center text-brown-soft">
            No carriers match those filters just yet. Try widening your search.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
