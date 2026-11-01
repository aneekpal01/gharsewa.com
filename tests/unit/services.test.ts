import { describe, it, expect } from "vitest";
import {
  serviceFiltersSchema,
  serviceSlugSchema,
  getCategories,
  getServices,
  getServiceBySlug,
  getRelatedServices,
} from "@/modules/services";
import { getActiveLocalities } from "@/modules/service-areas";

describe("Phase 2: Zod Schemas Validation", () => {
  it("validates and cleanses search and filter inputs", () => {
    const parsedEmpty = serviceFiltersSchema.parse({});
    expect(parsedEmpty.query).toBeUndefined();
    expect(parsedEmpty.category).toBeUndefined();
    expect(parsedEmpty.locality).toBeUndefined();

    const parsedAll = serviceFiltersSchema.parse({
      query: "  geyser repair  ",
      category: "all",
      locality: "all",
    });
    expect(parsedAll.query).toBe("geyser repair");
    expect(parsedAll.category).toBeUndefined();
    expect(parsedAll.locality).toBeUndefined();

    const parsedValid = serviceFiltersSchema.parse({
      query: "tap",
      category: "plumbing",
      locality: "mg-marg",
    });
    expect(parsedValid.query).toBe("tap");
    expect(parsedValid.category).toBe("plumbing");
    expect(parsedValid.locality).toBe("mg-marg");
  });

  it("rejects malicious or invalid category slugs", () => {
    const invalidResult = serviceFiltersSchema.safeParse({
      category: "invalid category with spaces!",
    });
    expect(invalidResult.success).toBe(false);
  });

  it("validates service slugs strictly", () => {
    expect(serviceSlugSchema.safeParse("switchboard-socket-repair").success).toBe(true);
    expect(serviceSlugSchema.safeParse("a").success).toBe(false);
    expect(serviceSlugSchema.safeParse("INVALID_UPPERCASE").success).toBe(false);
    expect(serviceSlugSchema.safeParse("slug with spaces").success).toBe(false);
  });
});

describe("Phase 2: Service Catalog Queries", () => {
  it("returns active Gangtok service categories", async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(6);
    expect(categories.map((c) => c.slug)).toContain("electrical-work");
    expect(categories.map((c) => c.slug)).toContain("plumbing");
    expect(categories.map((c) => c.slug)).toContain("home-cleaning");
  });

  it("filters services by category", async () => {
    const electricalServices = await getServices({ category: "electrical-work" });
    expect(electricalServices.length).toBeGreaterThan(0);
    expect(
      electricalServices.every((s) => s.category?.slug === "electrical-work")
    ).toBe(true);
  });

  it("filters services by Gangtok locality", async () => {
    const tadongServices = await getServices({ locality: "tadong" });
    expect(tadongServices.length).toBeGreaterThan(0);
    expect(
      tadongServices.every((s) =>
        s.serviceAreas?.some((a) => a.slug === "tadong")
      )
    ).toBe(true);
  });

  it("filters services by text search query", async () => {
    const searchResults = await getServices({ query: "geyser" });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].slug).toBe("water-geyser-diagnostic");
  });

  it("retrieves a single service by slug with its details", async () => {
    const service = await getServiceBySlug("water-geyser-diagnostic");
    expect(service).not.toBeNull();
    expect(service?.name).toContain("Water Geyser");
    expect(service?.included.length).toBeGreaterThan(0);
    expect(service?.excluded.length).toBeGreaterThan(0);
    expect(service?.basePrice).toBe(399);
  });

  it("returns null for non-existent service slug", async () => {
    const service = await getServiceBySlug("non-existent-service-slug");
    expect(service).toBeNull();
  });

  it("returns related services within the same category", async () => {
    const related = await getRelatedServices(
      "electrical-work",
      "switchboard-socket-repair"
    );
    expect(related.length).toBeGreaterThan(0);
    expect(related.some((s) => s.slug === "switchboard-socket-repair")).toBe(false);
  });
});

describe("Phase 2: Gangtok Service Areas Coverage", () => {
  it("returns all 6 approved Gangtok localities", async () => {
    const localities = await getActiveLocalities();
    expect(localities.length).toBe(6);

    const slugs = localities.map((l) => l.slug);
    expect(slugs).toContain("mg-marg");
    expect(slugs).toContain("lal-bazaar");
    expect(slugs).toContain("deorali");
    expect(slugs).toContain("tadong");
    expect(slugs).toContain("development-area");
    expect(slugs).toContain("arithang");

    // All must be Gangtok
    expect(localities.every((l) => l.city === "Gangtok")).toBe(true);
    // Verified 737101 and 737102 PIN codes
    expect(localities.every((l) => ["737101", "737102"].includes(l.pinCode))).toBe(true);
  });
});
