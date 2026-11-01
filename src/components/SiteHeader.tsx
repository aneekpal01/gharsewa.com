"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";

interface SiteHeaderProps {
  currentPath?: string;
  user?: {
    fullName?: string | null;
    phone?: string | null;
  } | null;
}

export function SiteHeader({ currentPath, user }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const loginUrl = currentPath && currentPath !== "/" && currentPath !== "/auth/login"
    ? `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`
    : "/auth/login";

  return (
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

        {user ? (
          <Link
            href="/account"
            className="button button-secondary button-small"
            onClick={() => setMenuOpen(false)}
          >
            Account
          </Link>
        ) : (
          <Link
            href={loginUrl}
            className="button button-primary button-small"
            onClick={() => setMenuOpen(false)}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
