"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GharSewa] Application error caught at root boundary:", error.message);
  }, [error]);

  return (
    <main className="site-shell">
      <SiteHeader />

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
          System Notice
        </span>
        <h1 style={{ fontSize: "2.5rem", margin: "16px 0" }}>
          Service temporarily unavailable
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "32px" }}>
          We are currently unable to connect to our operational database. Please retry in
          a moment.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Button onClick={() => reset()}>Try again</Button>
          <Link href="/" className="button button-secondary">
            Reload home
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
