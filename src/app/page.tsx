import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";
import {
  Button,
  Field,
  Icon,
  Notice,
  SectionHeading,
  StatusBadge,
  Surface,
} from "@/components/ui";
import { getFeaturedServices } from "@/modules/services";
import { getActiveLocalities } from "@/modules/service-areas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "GharSewa — Dependable Home Services for Gangtok",
  description:
    "Book verified local help for home repairs, electrical, plumbing, and deep cleaning in Gangtok, Sikkim. Clear scope, verified pricing.",
};

export default async function HomePage() {
  const featuredServices = await getFeaturedServices(3);
  const localities = await getActiveLocalities();

  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader currentPath="/" />

      <div id="main-content">
        {/* HERO SECTION */}
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true" /> Home services for Gangtok
            </p>
            <h1 id="hero-title">
              A dependable hand,
              <br />
              right when home needs one.
            </h1>
            <p className="hero-intro">
              Book trusted local help for the everyday work that keeps your home
              running. Clear service details, considered scheduling, and updates
              that keep you informed across Gangtok.
            </p>
            <div className="hero-actions">
              <Link href="/services" className="button">
                Explore services <Icon name="arrow" />
              </Link>
              <Link href="#how-it-works" className="button button-secondary">
                How booking works
              </Link>
            </div>
            <p className="availability-note">
              <Icon name="pin" /> Currently serving {localities.length} localities in
              Gangtok
            </p>
          </div>

          <aside className="service-callout" aria-label="Service availability note">
            <div className="callout-icon">
              <Icon name="calendar" />
            </div>
            <p className="eyebrow">Thoughtful scheduling</p>
            <h2>Plan ahead with confidence.</h2>
            <p>
              Booking availability, service times, and locality coverage will
              always be shown clearly before confirmation.
            </p>
            <span className="callout-rule">Advance booking: 1–7 days</span>
          </aside>
        </section>

        {/* SERVICE CATALOG HIGHLIGHTS */}
        <section className="section service-section" id="services">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <SectionHeading
              eyebrow="Service catalogue"
              title="Everyday help, clearly presented."
              copy="Explore verified service scopes with transparent pricing for Gangtok households."
            />
            <Link
              href="/services"
              className="button button-secondary"
              style={{ alignSelf: "center", marginBottom: "34px" }}
            >
              Browse all services <Icon name="arrow" />
            </Link>
          </div>

          <div className="service-grid">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section" id="how-it-works">
          <SectionHeading
            eyebrow="A clear process"
            title="No surprises along the way."
            copy="Our operational workflow guarantees verified technicians and clear billing boundaries."
          />
          <ol className="process-list">
            <li>
              <span>01</span>
              <div>
                <h3>Choose the service</h3>
                <p>
                  Review exactly what is included, what is excluded, and
                  transparent pricing terms.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Pick an eligible slot</h3>
                <p>
                  Available booking slots respect real travel times and Gangtok
                  terrain conditions.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Track meaningful updates</h3>
                <p>
                  Follow assignments and service progress with durable system
                  audit logs.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* GANGTOK SERVICE AREAS COVERAGE */}
        <section className="section" id="service-areas">
          <SectionHeading
            eyebrow="Gangtok coverage"
            title="Locality-specific availability."
            copy="We currently operate across 6 central Gangtok localities to ensure prompt arrival and reliable transit."
          />
          <div className="area-grid">
            {localities.map((area) => (
              <div key={area.id} className="area-card">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="eyebrow">{area.city}</span>
                  <span className="area-pin">PIN {area.pinCode}</span>
                </div>
                <h3>{area.name}</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                  Verified service routes & direct hill coverage.
                </p>
                <div className="area-status">
                  <Icon name="check" /> Active Coverage ({area.serviceCount ?? 0} services)
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN SYSTEM SECTION (Preserved from Phase 1) */}
        <section className="section system-section">
          <SectionHeading
            eyebrow="Design system"
            title="Built for clarity at every touchpoint."
            copy="A shared system keeps customer, worker, and operational surfaces legible without making them feel identical."
          />
          <div className="system-grid">
            <Surface title="Buttons & feedback" eyebrow="Actions">
              <div className="button-row">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="quiet">Quiet action</Button>
              </div>
              <Notice title="Clear communication">
                Status and payment language will use verified system data—not
                assumed browser state.
              </Notice>
            </Surface>
            <Surface title="Status language" eyebrow="Operational states">
              <div className="badge-row">
                <StatusBadge tone="pending">Pending</StatusBadge>
                <StatusBadge tone="assigned">Assigned</StatusBadge>
                <StatusBadge tone="success">Completed</StatusBadge>
                <StatusBadge tone="danger">Action needed</StatusBadge>
              </div>
              <p className="muted-copy">
                Colour supports the label; it never carries meaning by itself.
              </p>
            </Surface>
            <Surface title="Form controls" eyebrow="Accessible input">
              <div className="field-stack">
                <Field
                  label="Mobile number"
                  placeholder="Enter your number"
                  hint="Authentication is requested only when confirming a booking."
                />
                <Field label="Locality" placeholder="Gangtok Central" disabled />
              </div>
            </Surface>
          </div>
        </section>

        {/* ROLE-AWARE SYSTEM FOUNDATION (Preserved from Phase 1) */}
        <section className="section role-section">
          <SectionHeading
            eyebrow="Role-aware design"
            title="Purpose-built views, one dependable system."
            copy="Navigation and operational density adapt to each role while preserving the same accessibility and trust principles."
          />
          <div className="role-grid">
            <Surface title="Customer" eyebrow="Simple and guided">
              <ul>
                <li>Service discovery & verified catalog</li>
                <li>Clear pricing & scope boundaries</li>
                <li>Gangtok locality availability</li>
              </ul>
            </Surface>
            <Surface title="Worker" eyebrow="Focused in the field">
              <ul>
                <li>Assigned jobs only</li>
                <li>Action-led job details</li>
                <li>Availability controls</li>
              </ul>
            </Surface>
            <Surface title="Admin" eyebrow="Operational control">
              <ul>
                <li>Queue-first booking views</li>
                <li>Explicit status context</li>
                <li>Auditable actions</li>
              </ul>
            </Surface>
          </div>
        </section>

        {/* SUPPORT BAND */}
        <section className="support-band" id="support">
          <div>
            <p className="eyebrow">Need a hand?</p>
            <h2>Support should feel human, not hidden.</h2>
          </div>
          <Link href="/services" className="button button-light">
            View service catalogue <Icon name="arrow" />
          </Link>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
