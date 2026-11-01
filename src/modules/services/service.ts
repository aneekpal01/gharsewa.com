import "server-only";
import { getDb, checkDatabaseConnection } from "@/lib/db";
import {
  SEED_CATEGORIES,
  SEED_SERVICES,
  SEED_SERVICE_AREAS,
} from "./catalog-data";
import { serviceFiltersSchema, serviceSlugSchema } from "./schemas";
import { ServiceCategoryDTO, ServiceDTO, ServiceFilters } from "./types";

/**
 * Fetch all active service categories.
 */
export async function getCategories(): Promise<ServiceCategoryDTO[]> {
  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    try {
      const db = getDb();
      const categories = await db.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          _count: {
            select: { services: { where: { isActive: true } } },
          },
        },
      });

      return categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        serviceCount: cat._count.services,
      }));
    } catch (err) {
      console.warn("DB query failed, falling back to seed categories:", err);
    }
  }

  // Fallback to development seed data
  return SEED_CATEGORIES.map((cat) => ({
    ...cat,
    serviceCount: SEED_SERVICES.filter(
      (s) => s.categoryId === cat.id && s.isActive
    ).length,
  }));
}

/**
 * Fetch featured services for the homepage or highlights.
 */
export async function getFeaturedServices(limit = 4): Promise<ServiceDTO[]> {
  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    try {
      const db = getDb();
      const services = await db.service.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          serviceAreas: {
            include: { serviceArea: true },
          },
        },
      });

      return services.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        shortDescription: s.shortDescription,
        description: s.description,
        included: s.included,
        excluded: s.excluded,
        conditions: s.conditions,
        pricingModel: s.pricingModel as ServiceDTO["pricingModel"],
        basePrice: s.basePrice,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        isActive: s.isActive,
        category: s.category
          ? {
              id: s.category.id,
              name: s.category.name,
              slug: s.category.slug,
              description: s.category.description,
              icon: s.category.icon,
              displayOrder: s.category.displayOrder,
              isActive: s.category.isActive,
            }
          : undefined,
        serviceAreas: s.serviceAreas.map((sa) => ({
          id: sa.serviceArea.id,
          name: sa.serviceArea.name,
          slug: sa.serviceArea.slug,
          pinCode: sa.serviceArea.pinCode,
        })),
      }));
    } catch (err) {
      console.warn("DB query failed, falling back to seed services:", err);
    }
  }

  // Select distinct representative services for the homepage highlights
  const featured = [
    SEED_SERVICES.find((s) => s.category?.slug === "electrical-work"),
    SEED_SERVICES.find((s) => s.category?.slug === "plumbing"),
    SEED_SERVICES.find((s) => s.category?.slug === "home-cleaning"),
  ].filter((s): s is ServiceDTO => Boolean(s));

  return featured.length >= limit ? featured.slice(0, limit) : SEED_SERVICES.slice(0, limit);
}

/**
 * Query and filter services with Zod-validated filters.
 */
export async function getServices(rawFilters?: unknown): Promise<ServiceDTO[]> {
  const parsedFilters = serviceFiltersSchema.safeParse(rawFilters || {});
  if (!parsedFilters.success) {
    console.warn("Invalid service filters provided:", parsedFilters.error.format());
  }
  const filters: ServiceFilters = parsedFilters.success ? parsedFilters.data : {};

  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    try {
      const db = getDb();
      const whereClause: Record<string, unknown> = { isActive: true };

      if (filters.category) {
        whereClause.category = { slug: filters.category };
      }

      if (filters.locality) {
        whereClause.serviceAreas = {
          some: {
            serviceArea: {
              slug: filters.locality,
              isActive: true,
            },
          },
        };
      }

      if (filters.query) {
        whereClause.OR = [
          { name: { contains: filters.query, mode: "insensitive" } },
          { shortDescription: { contains: filters.query, mode: "insensitive" } },
          { description: { contains: filters.query, mode: "insensitive" } },
        ];
      }

      const services = await db.service.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        include: {
          category: true,
          serviceAreas: {
            include: { serviceArea: true },
          },
        },
      });

      return services.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        shortDescription: s.shortDescription,
        description: s.description,
        included: s.included,
        excluded: s.excluded,
        conditions: s.conditions,
        pricingModel: s.pricingModel as ServiceDTO["pricingModel"],
        basePrice: s.basePrice,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        isActive: s.isActive,
        category: s.category
          ? {
              id: s.category.id,
              name: s.category.name,
              slug: s.category.slug,
              description: s.category.description,
              icon: s.category.icon,
              displayOrder: s.category.displayOrder,
              isActive: s.category.isActive,
            }
          : undefined,
        serviceAreas: s.serviceAreas.map((sa) => ({
          id: sa.serviceArea.id,
          name: sa.serviceArea.name,
          slug: sa.serviceArea.slug,
          pinCode: sa.serviceArea.pinCode,
        })),
      }));
    } catch (err) {
      console.warn("DB query failed, falling back to seed services:", err);
    }
  }

  // Filter in memory for seed development data
  let result = [...SEED_SERVICES];

  if (filters.category) {
    result = result.filter((s) => s.category?.slug === filters.category);
  }

  if (filters.locality) {
    result = result.filter((s) =>
      s.serviceAreas?.some((area) => area.slug === filters.locality)
    );
  }

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }

  return result;
}

/**
 * Fetch single service by slug.
 */
export async function getServiceBySlug(rawSlug: unknown): Promise<ServiceDTO | null> {
  const parsedSlug = serviceSlugSchema.safeParse(rawSlug);
  if (!parsedSlug.success) {
    return null;
  }
  const slug = parsedSlug.data;

  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    try {
      const db = getDb();
      const s = await db.service.findFirst({
        where: { slug, isActive: true },
        include: {
          category: true,
          serviceAreas: {
            include: { serviceArea: true },
          },
        },
      });

      if (!s) return null;

      return {
        id: s.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        shortDescription: s.shortDescription,
        description: s.description,
        included: s.included,
        excluded: s.excluded,
        conditions: s.conditions,
        pricingModel: s.pricingModel as ServiceDTO["pricingModel"],
        basePrice: s.basePrice,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        isActive: s.isActive,
        category: s.category
          ? {
              id: s.category.id,
              name: s.category.name,
              slug: s.category.slug,
              description: s.category.description,
              icon: s.category.icon,
              displayOrder: s.category.displayOrder,
              isActive: s.category.isActive,
            }
          : undefined,
        serviceAreas: s.serviceAreas.map((sa) => ({
          id: sa.serviceArea.id,
          name: sa.serviceArea.name,
          slug: sa.serviceArea.slug,
          pinCode: sa.serviceArea.pinCode,
        })),
      };
    } catch (err) {
      console.warn("DB query failed, falling back to seed services:", err);
    }
  }

  const found = SEED_SERVICES.find((s) => s.slug === slug && s.isActive);
  return found || null;
}

/**
 * Fetch related services in the same category.
 */
export async function getRelatedServices(
  categorySlug: string,
  excludeSlug: string,
  limit = 3
): Promise<ServiceDTO[]> {
  const services = await getServices({ category: categorySlug });
  return services.filter((s) => s.slug !== excludeSlug).slice(0, limit);
}
