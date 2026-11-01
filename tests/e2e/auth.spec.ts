import { test, expect } from "@playwright/test";

test.describe("Phase 3: Customer Authentication Flows", () => {
  test("renders login screen with mobile OTP and Google sign-in", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.locator("h1")).toContainText("Welcome to GharSewa");
    await expect(page.locator('label[for="customer-phone"]')).toContainText("Mobile Number");
    await expect(page.locator("#customer-phone")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Send verification code");
    await expect(page.locator(".google-sign-in-button")).toContainText("Continue with Google");
    await expect(page.locator("text=Household Privacy & Protection")).toBeVisible();
  });

  test("preserves guest return URL intent across navigation", async ({ page, isMobile }) => {
    await page.goto("/services");

    if (isMobile) {
      await page.click(".menu-toggle");
    }

    // Click "Sign in" in header
    const signInButton = page.locator('nav a:has-text("Sign in")');
    await signInButton.click();

    await expect(page).toHaveURL(/\/auth\/login\?returnUrl=(%2F|\/)services/);
  });

  test("validates invalid phone input with accessible error notice", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill("#customer-phone", "12345");
    // Send button remains disabled for incomplete number
    const submitBtn = page.locator('button[type="submit"]:has-text("Send verification code")');
    await expect(submitBtn).toBeDisabled();
  });

  test("completes mobile OTP verification flow and establishes authenticated session", async ({
    page,
  }) => {
    // Generate a unique 10-digit number per test run to prevent concurrency collisions
    const uniqueDigits = Math.floor(10000 + Math.random() * 90000).toString();
    const testPhone = `98765${uniqueDigits}`;

    await page.goto("/auth/login?returnUrl=/services");

    // 1. Enter 10-digit mobile number
    await page.fill("#customer-phone", testPhone);
    await page.click('button[type="submit"]:has-text("Send verification code")');

    // 2. Wait for OTP step to appear
    await expect(page.locator('label[for="customer-otp"]')).toContainText("6-Digit Verification Code");
    await expect(page.locator("text=Code sent to")).toBeVisible();

    // 3. Auto-fill dev mock code
    const devFillBtn = page.locator('button:has-text("Fill Code")');
    await expect(devFillBtn).toBeVisible({ timeout: 10000 });
    await devFillBtn.click();

    // 4. Verify & Continue
    await page.click('button[type="submit"]:has-text("Verify & Continue")');

    // 5. Verify redirection to preserved return URL
    await page.waitForURL((url) => url.pathname === "/services", { timeout: 10000 });
    await expect(page).toHaveURL(/\/services/);

    // 6. Navigate to /account and verify profile
    await page.goto("/account");
    await expect(page.locator("h1")).toContainText("Profile & Security");
    await expect(page.locator(`text=+91${testPhone}`)).toBeVisible();
    await expect(page.locator(".badge-success")).toContainText("Verified");

    // 7. Test Logout
    const signOutBtn = page.locator('button[type="submit"]:has-text("Sign out")').first();
    await signOutBtn.click();

    await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });
    await expect(page).toHaveURL("/");
  });

  test("redirects unauthenticated access on protected account page to login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/auth\/login\?returnUrl=(%2F|\/)account/);
  });
});
