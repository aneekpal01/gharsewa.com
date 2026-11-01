import { test, expect } from "@playwright/test";

test.describe("Phase 1 Home Page & Visual Foundation", () => {
  test("renders hero, typography, service cards and skip link", async ({ page }) => {
    await page.goto("/");

    // Skip link
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();

    // Brand and Hero title
    await expect(page.locator(".brand")).toContainText("GharSewa");
    await expect(page.locator("h1#hero-title")).toContainText("A dependable hand");

    // Advance booking rule callout
    await expect(page.locator(".service-callout")).toContainText("Advance booking: 1–7 days");

    // Service catalog demonstration cards
    const cards = page.locator(".service-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Electrical work");
    await expect(cards.nth(1)).toContainText("Plumbing");
    await expect(cards.nth(2)).toContainText("Home cleaning");

    // Design system preview section
    await expect(page.locator(".badge-pending")).toContainText("Pending");
    await expect(page.locator(".badge-assigned")).toContainText("Assigned");
    await expect(page.locator(".badge-success")).toContainText("Completed");
    await expect(page.locator(".badge-danger")).toContainText("Action needed");
  });

  test("mobile navigation functions under responsive viewport", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile specific navigation test");
    await page.goto("/");

    const menuToggle = page.locator(".menu-toggle");
    await expect(menuToggle).toBeVisible();

    const primaryNav = page.locator("#primary-navigation");
    await expect(primaryNav).not.toHaveClass(/primary-nav-open/);

    await menuToggle.click();
    await expect(primaryNav).toHaveClass(/primary-nav-open/);
  });
});
