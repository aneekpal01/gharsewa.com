import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";
import { Icon, Notice } from "@/components/ui";
import { getServiceBySlug, getRelatedServices } from "@/modules/services";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service Not Found — GharSewa",
    };
  }

  return {
    title: `${service.name} — GharSewa Gangtok`,
    description: service.shortDescription,
  };
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const relatedServices = await getRelatedServices(
    service.category?.slug || "",
    service.slug,
    3
  );

  const pricingModelExplainer =
    service.pricingModel === "FLAT"
      ? "Fixed rate for standard scope. No unexpected technician fees."
      : service.pricingModel === "BASE_PLUS_HOURLY"
      ? "Base service covers diagnosis & first hour. Additional work confirmed before proceeding."
      : "On-site diagnostic inspection. Any required parts or extensive repair quoted before work begins.";

  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader currentPath="/services" />

      <div id="main-content" className="section" style={{ paddingTop: "32px" }}>
        {/* BREADCRUMBS */}
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/services">Services</Link>
          {service.category?.name ? (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/services?category=${service.category.slug}`}>
                {service.category.name}
              </Link>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{ color: "var(--ink)" }}>
            {service.name}
          </span>
        </nav>

        <Link href="/services" className="back-link">
          ← Back to all services
        </Link>

        {/* DETAIL GRID */}
        <div className="detail-grid">
          {/* MAIN CONTENT */}
          <div className="detail-main">
            <header className="detail-header">
              {service.category?.name ? (
                <span className="eyebrow">{service.category.name}</span>
              ) : null}
              <h1>{service.name}</h1>
              <p className="detail-lead">{service.shortDescription}</p>
            </header>

            {/* Description */}
            <section aria-labelledby="overview-heading">
              <h2 id="overview-heading" style={{ fontSize: "1.4rem", marginBottom: "12px" }}>
                Service overview
              </h2>
              <p style={{ lineHeight: 1.7, color: "#37473b" }}>{service.description}</p>
            </section>

            {/* What's Included */}
            <section className="detail-card" aria-labelledby="included-heading">
              <h2 id="included-heading" style={{ color: "var(--forest)" }}>
                What&apos;s included
              </h2>
              <ul className="checklist">
                {service.included.map((item, idx) => (
                  <li key={idx}>
                    <Icon name="check" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* What's Excluded */}
            <section className="detail-card" aria-labelledby="excluded-heading">
              <h2 id="excluded-heading" style={{ color: "var(--clay-dark)" }}>
                What&apos;s not included
              </h2>
              <ul className="checklist checklist-cross">
                {service.excluded.map((item, idx) => (
                  <li key={idx}>
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-grid",
                        placeItems: "center",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#fdeae6",
                        color: "var(--clay)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      ×
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Important Conditions */}
            {service.conditions.length > 0 ? (
              <section className="detail-card" aria-labelledby="conditions-heading">
                <h2 id="conditions-heading">Important conditions</h2>
                <ul className="checklist">
                  {service.conditions.map((item, idx) => (
                    <li key={idx}>
                      <Icon name="info" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Parts transparency guarantee */}
            <Notice title="Gangtok Material & Spare Parts Policy">
              Any required replacement hardware, cables, or spare parts are billed at
              actual local store retail price with customer approval. GharSewa does
              not markup material costs.
            </Notice>
          </div>

          {/* SIDEBAR */}
          <aside className="detail-sidebar" aria-label="Booking and pricing summary">
            <div className="pricing-summary-card">
              <span className="eyebrow">Transparent Pricing</span>
              <div className="service-price-tag">
                ₹{service.basePrice}
                <span>/ {service.pricingModel.toLowerCase().replace(/_/g, " ")}</span>
              </div>
              <p className="pricing-model-explainer">{pricingModelExplainer}</p>

              <div className="pricing-spec-list">
                <div className="pricing-spec-item">
                  <span>Estimated duration:</span>
                  <span>
                    <Icon name="clock" /> {service.estimatedDurationMinutes} mins
                  </span>
                </div>
                <div className="pricing-spec-item">
                  <span>Advance notice:</span>
                  <span>1–7 days</span>
                </div>
                <div className="pricing-spec-item">
                  <span>Payment terms:</span>
                  <span>Pay upon completion</span>
                </div>
              </div>

              {/* Disabled booking action indicator */}
              <button
                type="button"
                className="button button-disabled"
                disabled
                aria-disabled="true"
                style={{ width: "100%", marginBottom: "12px" }}
              >
                Booking opens soon
              </button>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  lineHeight: 1.45,
                  textAlign: "center",
                }}
              >
                Online booking and technician scheduling will be introduced in Phase 4.
                Service scope and transparent rates are published for household planning.
              </p>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <Link
                  href={`/auth/login?returnUrl=${encodeURIComponent(`/services/${service.slug}`)}`}
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--forest)",
                    textDecoration: "underline",
                    fontWeight: 500,
                  }}
                >
                  Sign in to save this service
                </Link>
              </div>

              <hr
                style={{
                  margin: "24px 0",
                  border: 0,
                  borderTop: "1px solid var(--line)",
                }}
              />

              {/* Service Areas */}
              <div>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Available Gangtok Localities
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    marginBottom: "8px",
                  }}
                >
                  Verified service available in:
                </p>
                {service.serviceAreas && service.serviceAreas.length > 0 ? (
                  <div className="localities-pill-grid">
                    {service.serviceAreas.map((area) => (
                      <span key={area.id || area.slug || area.name} className="locality-pill">
                        {area.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className="locality-unconfigured-note"
                    style={{
                      margin: "8px 0 0",
                      fontStyle: "italic",
                      color: "var(--muted)",
                      fontSize: "0.82rem",
                    }}
                  >
                    Availability not configured
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* RELATED SERVICES */}
        {relatedServices.length > 0 ? (
          <section
            style={{
              marginTop: "84px",
              paddingTop: "48px",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div style={{ marginBottom: "28px" }}>
              <span className="eyebrow">Related in this category</span>
              <h2 style={{ fontSize: "1.8rem", margin: "6px 0 0" }}>
                Other {service.category?.name || "recommended"} services
              </h2>
            </div>
            <div className="service-grid">
              {relatedServices.map((rel) => (
                <ServiceCard key={rel.id} service={rel} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <SiteFooter />
    </main>
  );
}
