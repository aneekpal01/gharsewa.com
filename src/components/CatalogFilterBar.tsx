"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "./ui";
import { ServiceCategoryDTO } from "@/modules/services";
import { ServiceAreaDTO } from "@/modules/service-areas";

interface CatalogFilterBarProps {
  categories: ServiceCategoryDTO[];
  localities: ServiceAreaDTO[];
  currentQuery?: string;
  currentCategory?: string;
  currentLocality?: string;
  totalResults: number;
}

export function CatalogFilterBar({
  categories,
  localities,
  currentQuery = "",
  currentCategory = "",
  currentLocality = "",
  totalResults,
}: CatalogFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const buildQueryUrl = (newParams: { q?: string; category?: string; locality?: string }) => {
    const params = new URLSearchParams();

    const q = newParams.q !== undefined ? newParams.q : currentQuery;
    const cat = newParams.category !== undefined ? newParams.category : currentCategory;
    const loc = newParams.locality !== undefined ? newParams.locality : currentLocality;

    if (q && q.trim()) params.set("q", q.trim());
    if (cat && cat !== "all") params.set("category", cat);
    if (loc && loc !== "all") params.set("locality", loc);

    const qs = params.toString();
    return qs ? `/services?${qs}` : "/services";
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("search")?.toString() || "";
    const locality = formData.get("locality")?.toString() || "";

    const url = buildQueryUrl({ q, locality });
    startTransition(() => {
      router.push(url);
      router.refresh();
    });
  };

  const hasActiveFilters = Boolean(
    currentQuery || currentCategory || currentLocality
  );

  return (
    <div>
      {/* Category Pills */}
      <div className="category-filter-chips" role="group" aria-label="Filter by service category">
        <Link
          href={buildQueryUrl({ category: "all" })}
          className={`chip ${!currentCategory || currentCategory === "all" ? "chip-active" : ""}`}
        >
          All categories
        </Link>
        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug;
          const href = buildQueryUrl({ category: isActive ? "all" : cat.slug });
          return (
            <Link
              key={cat.id}
              href={href}
              className={`chip ${isActive ? "chip-active" : ""}`}
            >
              <Icon
                name={
                  cat.icon as
                    | "bolt"
                    | "drop"
                    | "sparkle"
                    | "tools"
                    | "gear"
                    | "brush"
                }
              />
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Search Input and Locality Select */}
      <form className="catalog-controls" onSubmit={handleFormSubmit}>
        <div className="catalog-search-field">
          <label htmlFor="catalog-search-input">Search services</label>
          <div className="catalog-input-wrapper">
            <Icon name="search" />
            <input
              id="catalog-search-input"
              name="search"
              type="search"
              defaultValue={currentQuery}
              placeholder="e.g. switchboard, geyser, bathroom cleaning..."
            />
          </div>
        </div>

        <div className="catalog-select-field">
          <label htmlFor="catalog-locality-select">Gangtok Locality</label>
          <select
            id="catalog-locality-select"
            name="locality"
            className="catalog-select"
            defaultValue={currentLocality || "all"}
            onChange={(e) => {
              const url = buildQueryUrl({ locality: e.target.value });
              startTransition(() => {
                router.push(url);
                router.refresh();
              });
            }}
          >
            <option value="all">All Gangtok Localities</option>
            {localities.map((loc) => (
              <option key={loc.id} value={loc.slug}>
                {loc.name} ({loc.pinCode})
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Updating..." : "Filter"}
        </button>
      </form>

      {/* Results Metadata & Reset */}
      <div className="catalog-meta">
        <div>
          Showing <strong>{totalResults}</strong> verified service
          {totalResults === 1 ? "" : "s"}
          {currentCategory ? ` in ${currentCategory.replace("-", " ")}` : ""}
          {currentLocality ? ` for ${currentLocality.replace("-", " ")}` : ""}
        </div>

        {hasActiveFilters ? (
          <Link
            href="/services"
            className="text-link"
            style={{ fontSize: "0.84rem" }}
          >
            Clear all filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}
