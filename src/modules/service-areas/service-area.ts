import "server-only";
import { getDb, checkDatabaseConnection } from "@/lib/db";
import { SEED_SERVICE_AREAS, SEED_SERVICES } from "../services/catalog-data";
import { ServiceAreaDTO } from "./types";

/**
 * Get all active service localities in Gangtok.
 */
export async function getActiveLocalities(): Promise<ServiceAreaDTO[]> {
  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    try {
      const db = getDb();
      const areas = await db.serviceArea.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          _count: {
            select: { services: true },
          },
        },
      });

      return areas.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        city: a.city,
        pinCode: a.pinCode,
        displayOrder: a.displayOrder,
        isActive: a.isActive,
        serviceCount: a._count.services,
      }));
    } catch (err) {
      console.warn("DB query failed for localities, falling back to seed data:", err);
    }
  }

  return SEED_SERVICE_AREAS.map((a, index) => {
    const count = SEED_SERVICES.filter((s) =>
      s.serviceAreas?.some((sa) => sa.slug === a.slug)
    ).length;

    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      city: "Gangtok",
      pinCode: a.pinCode,
      displayOrder: index + 1,
      isActive: true,
      serviceCount: count,
    };
  });
}
