import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";
import { CatalogFilterBar } from "@/components/CatalogFilterBar";
import { SectionHeading, Icon } from "@/components/ui";
import { getCategories, getServices } from "@/modules/services";
import { getActiveLocalities } from "@/modules/service-areas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service Catalogue — GharSewa Gangtok",
  description:
    "Explore verified household services across Gangtok. Upfront pricing, clear scopes of work, and locality availability.",
};

interface ServicesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    locality?: string | string[];
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const resolvedParams = await searchParams;
  const query =
    typeof resolvedParams?.q === "string"
      ? resolvedParams.q
      : Array.isArray(resolvedParams?.q)
      ? resolvedParams.q[0]
      : "";
  const category =
    typeof resolvedParams?.category === "string"
      ? resolvedParams.category
      : Array.isArray(resolvedParams?.category)
      ? resolvedParams.category[0]
      : "";
  const locality =
    typeof resolvedParams?.locality === "string"
      ? resolvedParams.locality
      : Array.isArray(resolvedParams?.locality)
      ? resolvedParams.locality[0]
      : "";

  const [categories, localities, services] = await Promise.all([
    getCategories(),
    getActiveLocalities(),
    getServices({
      query,
      category,
      locality,
    }),
  ]);

  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader currentPath="/services" />

      <div id="main-content" className="section" style={{ paddingTop: "40px" }}>
        <div className="catalog-header section-heading">
          <p className="eyebrow">Gangtok Service Catalogue</p>
          <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3.25rem)", lineHeight: 1.04, marginBottom: "13px" }}>
            Every service, defined with precision.
          </h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.65 }}>
            Every service lists what is included, what is excluded, and clear pricing terms before you request booking.
          </p>
        </div>

        {/* Filter Controls (Client component) */}
        <CatalogFilterBar
          categories={categories}
          localities={localities}
          currentQuery={query}
          currentCategory={category}
          currentLocality={locality}
          totalResults={services.length}
        />

        {/* Service Grid or Empty State */}
        {services.length === 0 ? (
          <div className="empty-state" role="status">
            <h3>No services matched your filter</h3>
            <p>
              We couldn&apos;t find any service matching your current search or locality
              selection. Try clearing your filters or selecting a different Gangtok area.
            </p>
            <Link href="/services" className="button">
              View all services
            </Link>
          </div>
        ) : (
          <div className="service-grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Gangtok Service Promise Callout */}
        <div
          style={{
            marginTop: "64px",
            padding: "24px 28px",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#eaf3eb",
                color: "var(--forest)",
              }}
            >
              <Icon name="shield" />
            </div>
            <div>
              <strong>Transparent Parts & Pricing Guarantee</strong>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                }}
              >
                Replacement materials are never marked up. You inspect the invoice and pay actual store prices.
              </p>
            </div>
          </div>
          <Link href="/#how-it-works" className="text-link">
            Learn how booking works <Icon name="arrow" />
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
