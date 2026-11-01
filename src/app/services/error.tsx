"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui";

export default function ServicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Services catalogue error boundary caught:", error);
  }, [error]);

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
        <span className="eyebrow" style={{ color: "var(--clay)" }}>
          Catalogue Error
        </span>
        <h1 style={{ fontSize: "2.5rem", margin: "16px 0" }}>
          Unable to load services
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "32px" }}>
          An unexpected issue occurred while fetching the service catalogue.
          Please retry or return to the homepage.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Button onClick={() => reset()}>Try again</Button>
          <Link href="/" className="button button-secondary">
            Go to home
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
