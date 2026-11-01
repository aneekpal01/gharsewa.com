import { test, expect } from "@playwright/test";

test.describe("Phase 2: Customer Experience & Service Catalog", () => {
  test("browses service catalogue, filters by category and search", async ({
    page,
  }) => {
    await page.goto("/services");

    // Catalog heading and controls
    await expect(page.locator("h1")).toContainText("Every service, defined with precision");
    await expect(page.locator(".category-filter-chips")).toBeVisible();
    await expect(page.locator("#catalog-search-input")).toBeVisible();
    await expect(page.locator("#catalog-locality-select")).toBeVisible();

    // Initial service count
    const initialCards = page.locator(".service-card");
    await expect(initialCards).toHaveCount(8);

    // Filter by Electrical category chip
    const electricalChip = page.locator('.chip:has-text("Electrical work")');
    await electricalChip.click();
    await expect(page).toHaveURL(/category=electrical-work/);
    await expect(page.locator(".catalog-meta")).toContainText("in electrical work");
    await expect(page.locator(".service-card")).toHaveCount(2);

    // Search for a specific term: "socket"
    await page.fill("#catalog-search-input", "socket");
    await page.click('button[type="submit"]:has-text("Filter")');
    await expect(page).toHaveURL(/q=socket/);
    await expect(page.locator(".catalog-meta strong")).toHaveText("1");

    const searchCards = page.locator(".service-card");
    await expect(searchCards).toHaveCount(1);
    await expect(searchCards.first()).toContainText("Switchboard & Socket Repair");

    // Clear filters
    await page.click('text=Clear all filters');
    await expect(page.locator(".catalog-meta strong")).toHaveText("8");
    await expect(page.locator(".service-card")).toHaveCount(8);
  });

  test("navigates to service detail page and inspects inclusions, exclusions & pricing", async ({
    page,
  }) => {
    await page.goto("/services");

    // Click "View details" on the first service card
    const firstDetailLink = page.locator(".service-card-action").first();
    await firstDetailLink.click();

    // Wait for detail page load
    await expect(page).toHaveURL(/\/services\/[a-z0-9-]+/);

    // Detail elements
    await expect(page.locator(".breadcrumbs")).toBeVisible();
    await expect(page.locator(".detail-header h1")).toBeVisible();
    await expect(page.locator(".checklist").first()).toBeVisible();

    // Inclusions and Exclusions
    await expect(page.locator("h2#included-heading")).toContainText("What's included");
    await expect(page.locator("h2#excluded-heading")).toContainText("What's not included");

    // Pricing summary card
    const pricingCard = page.locator(".pricing-summary-card");
    await expect(pricingCard).toBeVisible();
    await expect(pricingCard.locator(".service-price-tag")).toContainText("₹");
    await expect(pricingCard.locator(".localities-pill-grid")).toBeVisible();

    // Back link
    await page.click(".back-link");
    await expect(page).toHaveURL("/services");
  });

  test("displays friendly 404 state for non-existent service slug", async ({
    page,
  }) => {
    await page.goto("/services/non-existent-service-slug");

    await expect(page.locator("h1")).toContainText("Service not found");
    const browseButton = page.locator('a.button:has-text("Browse all services")');
    await expect(browseButton).toBeVisible();
  });
});
