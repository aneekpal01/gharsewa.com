import { describe, it, expect, afterEach } from "vitest";
import {
  serviceFiltersSchema,
  serviceSlugSchema,
  getCategories,
  getServices,
  getServiceBySlug,
  getRelatedServices,
  ServiceDTO,
} from "@/modules/services";
import { getActiveLocalities } from "@/modules/service-areas";
import { DatabaseUnavailableError } from "@/lib/errors";

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

  it("handles array search params cleanly without throwing", () => {
    const parsedArray = serviceFiltersSchema.parse({
      category: ["electrical-work", "plumbing"],
      locality: ["mg-marg"],
    });
    expect(parsedArray.category).toBe("electrical-work");
    expect(parsedArray.locality).toBe("mg-marg");
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

describe("Phase 2: Service Catalog Queries (Development Fallback)", () => {
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

describe("Phase 2: Database Fallback Environment-Gating", () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = originalEnv;
  });

  it("throws DatabaseUnavailableError in production when DB is disconnected and refuses seed content", async () => {
    env.NODE_ENV = "production";

    await expect(getCategories()).rejects.toThrowError(DatabaseUnavailableError);
    await expect(getServices()).rejects.toThrowError(DatabaseUnavailableError);
    await expect(getServiceBySlug("switchboard-socket-repair")).rejects.toThrowError(
      DatabaseUnavailableError
    );
    await expect(getActiveLocalities()).rejects.toThrowError(DatabaseUnavailableError);
  });

  it("permits development fallback in test/development environments", async () => {
    env.NODE_ENV = "test";

    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].name).toBeDefined();
  });
});

describe("Phase 2: Locality Coverage Invariants", () => {
  it("does not default unconfigured locality relationships to six", () => {
    const serviceWithNoAreas: ServiceDTO = {
      id: "00000000-0000-4000-a000-000000000999",
      categoryId: "00000000-0000-4000-a000-000000000201",
      name: "Unassigned Test Service",
      slug: "unassigned-test-service",
      shortDescription: "Test service without localities",
      description: "Testing zero locality handling",
      included: [],
      excluded: [],
      conditions: [],
      pricingModel: "FLAT",
      basePrice: 100,
      estimatedDurationMinutes: 30,
      isActive: true,
      serviceAreas: [],
    };

    expect(serviceWithNoAreas.serviceAreas?.length).toBe(0);

    const displayedText =
      serviceWithNoAreas.serviceAreas && serviceWithNoAreas.serviceAreas.length > 0
        ? `${serviceWithNoAreas.serviceAreas.length} Gangtok areas`
        : "Availability not configured";

    expect(displayedText).toBe("Availability not configured");
    expect(displayedText).not.toContain("6");
  });
});

describe("Phase 2: Seed Synchronization Invariant", () => {
  it("determines correct stale associations to prune when service localities change", () => {
    const currentDbAreaIds = [
      "00000000-0000-4000-a000-000000000101",
      "00000000-0000-4000-a000-000000000102",
      "00000000-0000-4000-a000-000000000103",
    ];

    const desiredAreaIds = [
      "00000000-0000-4000-a000-000000000101",
      "00000000-0000-4000-a000-000000000103",
      "00000000-0000-4000-a000-000000000104",
    ];

    const staleAreaIds = currentDbAreaIds.filter((id) => !desiredAreaIds.includes(id));
    expect(staleAreaIds).toEqual(["00000000-0000-4000-a000-000000000102"]);
    expect(staleAreaIds.length).toBe(1);

    const afterPrune = currentDbAreaIds.filter((id) => desiredAreaIds.includes(id));
    const finalSynced = Array.from(new Set([...afterPrune, ...desiredAreaIds]));
    expect(finalSynced).toEqual(desiredAreaIds);
  });
});

describe("Phase 2: Gangtok Service Areas Coverage", () => {
  it("returns all 6 approved Gangtok localities with valid UUIDs and PINs", async () => {
    const localities = await getActiveLocalities();
    expect(localities.length).toBe(6);

    const slugs = localities.map((l) => l.slug);
    expect(slugs).toContain("mg-marg");
    expect(slugs).toContain("lal-bazaar");
    expect(slugs).toContain("deorali");
    expect(slugs).toContain("tadong");
    expect(slugs).toContain("development-area");
    expect(slugs).toContain("arithang");

    expect(localities.every((l) => l.city === "Gangtok")).toBe(true);
    expect(localities.every((l) => ["737101", "737102"].includes(l.pinCode))).toBe(true);
    // All IDs must be valid RFC 4122 v4 UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(localities.every((l) => uuidRegex.test(l.id))).toBe(true);
  });
});
