import { PrismaClient, PricingModel } from "@prisma/client";
import { SEED_CATEGORIES, SEED_SERVICE_AREAS, SEED_SERVICES } from "../src/modules/services/catalog-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting GharSewa Phase 2 catalog seed (Development Data)...");
  console.log("⚠️ NOTICE: All catalog entries represent curated service definitions for Gangtok.");
  console.log("⚠️ No fictitious workers, reviews, or customer ratings are included.\n");

  // Upsert Service Areas
  console.log("📍 Seeding Gangtok service areas...");
  for (const area of SEED_SERVICE_AREAS) {
    await prisma.serviceArea.upsert({
      where: { slug: area.slug },
      update: {
        name: area.name,
        pinCode: area.pinCode,
        city: "Gangtok",
        isActive: true,
      },
      create: {
        id: area.id.length === 36 ? area.id : undefined,
        name: area.name,
        slug: area.slug,
        pinCode: area.pinCode,
        city: "Gangtok",
        isActive: true,
      },
    });
    console.log(`  ✓ Area: ${area.name} (${area.pinCode})`);
  }

  // Upsert Service Categories
  console.log("\n🗂️ Seeding service categories...");
  for (const cat of SEED_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // Fetch created categories and areas to link foreign keys
  const dbCategories = await prisma.serviceCategory.findMany();
  const dbAreas = await prisma.serviceArea.findMany();

  const catMap = new Map(dbCategories.map((c) => [c.slug, c.id]));
  const areaMap = new Map(dbAreas.map((a) => [a.slug, a.id]));

  // Upsert Services
  console.log("\n🛠️ Seeding verified service catalog items...");
  for (const srv of SEED_SERVICES) {
    const categoryId = catMap.get(srv.category?.slug || "");
    if (!categoryId) {
      console.warn(`  ⚠️ Category not found for service ${srv.slug}, skipping.`);
      continue;
    }

    const service = await prisma.service.upsert({
      where: { slug: srv.slug },
      update: {
        categoryId,
        name: srv.name,
        shortDescription: srv.shortDescription,
        description: srv.description,
        included: srv.included,
        excluded: srv.excluded,
        conditions: srv.conditions,
        pricingModel: srv.pricingModel as PricingModel,
        basePrice: srv.basePrice,
        estimatedDurationMinutes: srv.estimatedDurationMinutes,
        isActive: true,
      },
      create: {
        categoryId,
        name: srv.name,
        slug: srv.slug,
        shortDescription: srv.shortDescription,
        description: srv.description,
        included: srv.included,
        excluded: srv.excluded,
        conditions: srv.conditions,
        pricingModel: srv.pricingModel as PricingModel,
        basePrice: srv.basePrice,
        estimatedDurationMinutes: srv.estimatedDurationMinutes,
        isActive: true,
      },
    });

    // Link service areas
    for (const area of srv.serviceAreas || []) {
      const areaId = areaMap.get(area.slug);
      if (areaId) {
        await prisma.serviceAreaService.upsert({
          where: {
            serviceId_serviceAreaId: {
              serviceId: service.id,
              serviceAreaId: areaId,
            },
          },
          update: {},
          create: {
            serviceId: service.id,
            serviceAreaId: areaId,
          },
        });
      }
    }

    console.log(`  ✓ Service: ${srv.name} (₹${srv.basePrice}, ${srv.pricingModel})`);
  }

  console.log("\n✅ Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
