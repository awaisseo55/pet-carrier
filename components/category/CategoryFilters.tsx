"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { SlidersHorizontal, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FilterSection } from "./FilterSection";
import { ActiveFilterPills, type FilterPill } from "./ActiveFilterPills";
import { SortDropdown } from "./SortDropdown";
import { FilterDrawer } from "./FilterDrawer";
import {
  PET_TYPE_OPTIONS,
  PET_SIZE_OPTIONS,
  STYLE_OPTIONS,
  USE_CASE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  RATING_OPTIONS,
  COLOUR_SWATCHES,
  getProductFacets,
  type FilterOption,
} from "@/lib/product-facets";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  fromSearchParams,
  hasActiveFilters,
  productMatchesFilters,
  sortProducts,
  toSearchParams,
  toggleBoolean,
  toggleMultiValue,
  toggleSingleValue,
  type ActiveFilters,
  type MultiFilterKey,
  type SectionKey,
  type SingleFilterKey,
} from "@/lib/product-filters";
import { slugify } from "@/lib/utils";
import type { PublicProduct } from "@/lib/types";

// Below this many products in the category, filtering isn't worth the UI
// weight (per spec: <12 products shows sort only, no sidebar/drawer).
const FILTER_THRESHOLD = 12;

interface CategoryFiltersProps {
  products: PublicProduct[];
}

function countOptions(
  products: PublicProduct[],
  filters: ActiveFilters,
  exclude: SectionKey,
  options: FilterOption[],
  getValues: (p: PublicProduct) => string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  options.forEach((o) => (counts[o.value] = 0));
  products.forEach((p) => {
    if (!productMatchesFilters(p, filters, exclude)) return;
    getValues(p).forEach((v) => {
      if (counts[v] !== undefined) counts[v] += 1;
    });
  });
  return counts;
}

function priceBucketFor(price: number): string | undefined {
  return PRICE_RANGE_OPTIONS.find((r) => price >= r.min && price < r.max)?.value;
}

function ratingBucketsFor(rating: number): string[] {
  return RATING_OPTIONS.filter((r) => rating >= r.min).map((r) => r.value);
}

// history.pushState() doesn't fire "popstate" (only back/forward does), so
// pushFilters below dispatches this after every programmatic navigation to
// keep useSyncExternalStore's subscribers in sync.
const LOCATION_CHANGE_EVENT = "pc:locationchange";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(LOCATION_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(LOCATION_CHANGE_EVENT, callback);
  };
}

const getLocationSearch = () => window.location.search;
const getServerLocationSearch = () => "";

export function CategoryFilters({ products }: CategoryFiltersProps) {
  const pathname = usePathname();

  // Deliberately not next/navigation's useSearchParams(): that hook forces
  // this whole subtree to skip static rendering and de-opt to a client-only
  // Suspense fallback, which would mean the product grid (and its SEO
  // content) goes missing from the prerendered HTML on the base category
  // URL. useSyncExternalStore reads window.location directly, with an empty
  // string as its SSR-safe server snapshot, so the initial render (server
  // and client alike) always shows the unfiltered grid; the real query
  // string, if any, is picked up as soon as React syncs with the browser,
  // and a shared/bookmarked filtered link applies correctly from there.
  const search = useSyncExternalStore(subscribeToLocation, getLocationSearch, getServerLocationSearch);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const appliedFilters = useMemo(() => fromSearchParams(searchParams), [searchParams]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ActiveFilters>(appliedFilters);

  // Re-seed the drawer's draft from the URL at the moment it opens (rather
  // than reactively in an effect), so a previous unapplied edit doesn't
  // linger into the next session.
  const openMobileFilters = useCallback(() => {
    setDraftFilters(appliedFilters);
    setMobileOpen(true);
  }, [appliedFilters]);

  const showFilters = products.length >= FILTER_THRESHOLD;

  const pushFilters = useCallback(
    (next: ActiveFilters) => {
      const qs = toSearchParams(next).toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      window.history.pushState(null, "", url);
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
    },
    [pathname]
  );

  const colourOptions: FilterOption[] = useMemo(() => {
    const present = new Set<string>();
    products.forEach((p) => getProductFacets(p).colours.forEach((c) => present.add(c)));
    return [...present]
      .filter((v) => COLOUR_SWATCHES[v])
      .map((v) => ({ value: v, label: COLOUR_SWATCHES[v].label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const brandOptions: FilterOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    products.forEach((p) => {
      if (p.brand) seen.set(slugify(p.brand), p.brand);
    });
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const sectionCounts = useCallback(
    (filters: ActiveFilters) => ({
      pet: countOptions(products, filters, "pet", PET_TYPE_OPTIONS, (p) => getProductFacets(p).petTypes),
      size: countOptions(products, filters, "size", PET_SIZE_OPTIONS, (p) => getProductFacets(p).petSizes),
      style: countOptions(products, filters, "style", STYLE_OPTIONS, (p) => getProductFacets(p).styles),
      use: countOptions(products, filters, "use", USE_CASE_OPTIONS, (p) => getProductFacets(p).useCases),
      colour: countOptions(products, filters, "colour", colourOptions, (p) => getProductFacets(p).colours),
      brand: countOptions(products, filters, "brand", brandOptions, (p) => [slugify(p.brand)]),
      price: countOptions(products, filters, "price", PRICE_RANGE_OPTIONS, (p) => {
        const bucket = priceBucketFor(p.price);
        return bucket ? [bucket] : [];
      }),
      rating: countOptions(products, filters, "rating", RATING_OPTIONS, (p) => ratingBucketsFor(p.averageRating ?? 0)),
    }),
    [products, colourOptions, brandOptions]
  );

  const desktopCounts = useMemo(() => sectionCounts(appliedFilters), [sectionCounts, appliedFilters]);
  const draftCounts = useMemo(() => sectionCounts(draftFilters), [sectionCounts, draftFilters]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((p) => productMatchesFilters(p, appliedFilters));
    return sortProducts(filtered, appliedFilters.sort);
  }, [products, appliedFilters]);

  const draftResultCount = useMemo(
    () => products.filter((p) => productMatchesFilters(p, draftFilters)).length,
    [products, draftFilters]
  );

  function buildPills(filters: ActiveFilters): FilterPill[] {
    const pills: FilterPill[] = [];
    const addAll = (key: MultiFilterKey, options: FilterOption[]) => {
      filters[key].forEach((value) => {
        const option = options.find((o) => o.value === value);
        if (option) pills.push({ key: `${key}:${value}`, label: option.label });
      });
    };
    addAll("pet", PET_TYPE_OPTIONS);
    addAll("size", PET_SIZE_OPTIONS);
    addAll("style", STYLE_OPTIONS);
    addAll("use", USE_CASE_OPTIONS);
    addAll("colour", colourOptions);
    addAll("brand", brandOptions);
    if (filters.price) {
      const option = PRICE_RANGE_OPTIONS.find((o) => o.value === filters.price);
      if (option) pills.push({ key: "price", label: option.label });
    }
    if (filters.rating) {
      const option = RATING_OPTIONS.find((o) => o.value === filters.rating);
      if (option) pills.push({ key: "rating", label: option.label });
    }
    if (filters.sale) pills.push({ key: "sale", label: "On Sale" });
    if (!filters.stock) pills.push({ key: "stock", label: "Include Out of Stock" });
    return pills;
  }

  function removePill(filters: ActiveFilters, key: string): ActiveFilters {
    if (key === "sale" || key === "stock") return toggleBoolean(filters, key);
    if (key === "price") return { ...filters, price: null };
    if (key === "rating") return { ...filters, rating: null };
    const [section, value] = key.split(":") as [MultiFilterKey, string];
    return toggleMultiValue(filters, section, value);
  }

  function renderSections(filters: ActiveFilters, counts: ReturnType<typeof sectionCounts>, onToggleMulti: (key: MultiFilterKey, value: string) => void, onToggleSingle: (key: SingleFilterKey, value: string) => void) {
    return (
      <>
        <FilterSection
          title="Pet Type"
          options={PET_TYPE_OPTIONS}
          counts={counts.pet}
          selected={filters.pet}
          onToggle={(v) => onToggleMulti("pet", v)}
        />
        <FilterSection
          title="Pet Size"
          options={PET_SIZE_OPTIONS}
          counts={counts.size}
          selected={filters.size}
          onToggle={(v) => onToggleMulti("size", v)}
        />
        <FilterSection
          title="Carrier Style"
          options={STYLE_OPTIONS}
          counts={counts.style}
          selected={filters.style}
          onToggle={(v) => onToggleMulti("style", v)}
        />
        <FilterSection
          title="Use Case"
          options={USE_CASE_OPTIONS}
          counts={counts.use}
          selected={filters.use}
          onToggle={(v) => onToggleMulti("use", v)}
        />
        {colourOptions.length > 0 && (
          <FilterSection
            title="Colour"
            options={colourOptions}
            counts={counts.colour}
            selected={filters.colour}
            onToggle={(v) => onToggleMulti("colour", v)}
            renderOption={(option) => (
              <span className="flex items-center gap-2">
                <span
                  className="size-3.5 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: COLOUR_SWATCHES[option.value]?.hex }}
                />
                {option.label}
              </span>
            )}
          />
        )}
        <FilterSection
          title="Price"
          options={PRICE_RANGE_OPTIONS}
          counts={counts.price}
          selected={filters.price ? [filters.price] : []}
          onToggle={(v) => onToggleSingle("price", v)}
        />
        {brandOptions.length > 0 && (
          <FilterSection
            title="Brand"
            options={brandOptions}
            counts={counts.brand}
            selected={filters.brand}
            onToggle={(v) => onToggleMulti("brand", v)}
          />
        )}
        <FilterSection
          title="Rating"
          options={RATING_OPTIONS}
          counts={counts.rating}
          selected={filters.rating ? [filters.rating] : []}
          onToggle={(v) => onToggleSingle("rating", v)}
        />
      </>
    );
  }

  if (!showFilters) {
    return (
      <div>
        <div className="flex items-center justify-end">
          <SortDropdown value={appliedFilters.sort} onChange={(sort) => pushFilters({ ...appliedFilters, sort })} />
        </div>
        <ProductResults products={visibleProducts} total={products.length} onClearAll={undefined} />
      </div>
    );
  }

  const pills = buildPills(appliedFilters);

  return (
    <div>
      {/* Mobile: filter button + sort, drawer, pills below */}
      <div className="flex items-center gap-3 lg:hidden">
        <Button variant="outline" className="flex-1" onClick={openMobileFilters}>
          <SlidersHorizontal className="size-4" />
          Filter{activeFilterCount(appliedFilters) > 0 ? ` (${activeFilterCount(appliedFilters)})` : ""}
        </Button>
        <SortDropdown value={appliedFilters.sort} onChange={(sort) => pushFilters({ ...appliedFilters, sort })} />
      </div>
      {pills.length > 0 && (
        <div className="mt-3 lg:hidden">
          <ActiveFilterPills
            pills={pills}
            onRemove={(key) => pushFilters(removePill(appliedFilters, key))}
            onClearAll={() => pushFilters({ ...DEFAULT_FILTERS, sort: appliedFilters.sort })}
          />
        </div>
      )}

      <FilterDrawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        resultCount={draftResultCount}
        onApply={() => {
          pushFilters(draftFilters);
          setMobileOpen(false);
        }}
        onClearAll={() => {
          const cleared = { ...DEFAULT_FILTERS, sort: draftFilters.sort };
          setDraftFilters(cleared);
          pushFilters(cleared);
          setMobileOpen(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-border py-4">
          <span className="text-sm font-medium text-foreground">On Sale</span>
          <Switch checked={draftFilters.sale} onCheckedChange={() => setDraftFilters((f) => toggleBoolean(f, "sale"))} />
        </div>
        <div className="flex items-center justify-between border-b border-border py-4">
          <span className="text-sm font-medium text-foreground">In Stock Only</span>
          <Switch checked={draftFilters.stock} onCheckedChange={() => setDraftFilters((f) => toggleBoolean(f, "stock"))} />
        </div>
        {renderSections(
          draftFilters,
          draftCounts,
          (key, value) => setDraftFilters((f) => toggleMultiValue(f, key, value)),
          (key, value) => setDraftFilters((f) => toggleSingleValue(f, key, value))
        )}
      </FilterDrawer>

      {/* Desktop: sidebar + main area */}
      <div className="mt-4 grid grid-cols-1 gap-8 lg:mt-0 lg:grid-cols-[1fr_3fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Filter Products</h2>
              {hasActiveFilters(appliedFilters) && (
                <button
                  type="button"
                  onClick={() => pushFilters({ ...DEFAULT_FILTERS, sort: appliedFilters.sort })}
                  className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between border-b border-border py-3">
              <span className="text-sm font-medium text-foreground">On Sale</span>
              <Switch
                checked={appliedFilters.sale}
                onCheckedChange={() => pushFilters(toggleBoolean(appliedFilters, "sale"))}
              />
            </div>
            <div className="flex items-center justify-between border-b border-border py-3">
              <span className="text-sm font-medium text-foreground">In Stock Only</span>
              <Switch
                checked={appliedFilters.stock}
                onCheckedChange={() => pushFilters(toggleBoolean(appliedFilters, "stock"))}
              />
            </div>
            {renderSections(
              appliedFilters,
              desktopCounts,
              (key, value) => pushFilters(toggleMultiValue(appliedFilters, key, value)),
              (key, value) => pushFilters(toggleSingleValue(appliedFilters, key, value))
            )}
          </div>
        </aside>

        <div>
          <div className="hidden items-center justify-between lg:flex">
            {pills.length > 0 ? (
              <ActiveFilterPills
                pills={pills}
                onRemove={(key) => pushFilters(removePill(appliedFilters, key))}
                onClearAll={() => pushFilters({ ...DEFAULT_FILTERS, sort: appliedFilters.sort })}
              />
            ) : (
              <span />
            )}
            <SortDropdown value={appliedFilters.sort} onChange={(sort) => pushFilters({ ...appliedFilters, sort })} />
          </div>
          <ProductResults
            products={visibleProducts}
            total={products.length}
            onClearAll={() => pushFilters({ ...DEFAULT_FILTERS, sort: appliedFilters.sort })}
          />
        </div>
      </div>
    </div>
  );
}

function ProductResults({
  products,
  total,
  onClearAll,
}: {
  products: PublicProduct[];
  total: number;
  onClearAll?: () => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm text-gray-500">
        Showing {products.length} of {total} products
      </p>
      {products.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center">
          <PackageSearch className="size-10 text-gray-400" />
          <p className="font-medium text-foreground">No products match those filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try clearing some filters to see more results.
          </p>
          {onClearAll && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
