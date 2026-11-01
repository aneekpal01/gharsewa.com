import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>GharSewa</strong> · Gangtok, Sikkim
        <p style={{ margin: "4px 0 0", fontSize: "0.76rem" }}>
          Dependable home services across Gangtok. Clear scope, verified pricing.
        </p>
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <Link href="/services">Service Catalog</Link>
        <Link href="/#service-areas">Coverage Areas</Link>
        <Link href="/#how-it-works">Booking Process</Link>
      </div>
    </footer>
  );
}
