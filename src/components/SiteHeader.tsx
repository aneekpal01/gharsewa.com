"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Icon } from "./ui";

interface SiteHeaderProps {
  currentPath?: string;
}

export function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="GharSewa home">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="home" />
          </span>
          <span>
            Ghar<span>Sewa</span>
          </span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name="menu" />
          <span>Menu</span>
        </button>

        <nav
          className={menuOpen ? "primary-nav primary-nav-open" : "primary-nav"}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          <Link
            href="/services"
            className={currentPath?.startsWith("/services") ? "text-forest font-bold" : ""}
            onClick={() => setMenuOpen(false)}
          >
            Services
          </Link>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </Link>
          <Link href="/#service-areas" onClick={() => setMenuOpen(false)}>
            Service areas
          </Link>
          <Link href="/#support" onClick={() => setMenuOpen(false)}>
            Support
          </Link>
          <Button size="small" onClick={() => setDialogOpen(true)}>
            Sign in
          </Button>
        </nav>
      </header>

      {dialogOpen ? (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setDialogOpen(false)}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="dialog-close"
              type="button"
              aria-label="Close dialog"
              onClick={() => setDialogOpen(false)}
            >
              ×
            </button>
            <p className="eyebrow">Account access</p>
            <h2 id="dialog-title">
              Authentication will be introduced at booking confirmation.
            </h2>
            <p>
              Customer OTP and Google authentication are scheduled for Phase 3.
              You can freely browse and inspect all verified service catalog
              details right now.
            </p>
            <Button onClick={() => setDialogOpen(false)}>Understood</Button>
          </section>
        </div>
      ) : null}
    </>
  );
}
