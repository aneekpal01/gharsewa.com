import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Icon } from "@/components/ui";

export default function ServiceNotFound() {
  return (
    <main className="site-shell">
      <SiteHeader currentPath="/services" />

      <div
        className="section"
        style={{
          paddingTop: "80px",
          paddingBottom: "100px",
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        <span className="eyebrow">Service Notice</span>
        <h1 style={{ fontSize: "2.5rem", margin: "16px 0" }}>
          Service not found
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "32px" }}>
          The requested service is not currently available or does not exist in our
          Gangtok catalogue. You can explore all available household services below.
        </p>

        <Link href="/services" className="button">
          Browse all services <Icon name="arrow" />
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}
