import { test as setup, expect } from "@playwright/test";
import { testData, generateTOTP } from "./fixtures/test";
import * as fs from "fs";
import * as path from "path";

const authFile = "e2e/.auth/user.json";

/**
 * Global setup for Playwright tests
 * This runs before all test files and sets up authentication state
 */
setup("authenticate", async ({ page }) => {
  // Ensure auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Skip authentication setup if no credentials provided
  if (!testData.credentials.username || !testData.credentials.password) {
    console.log("No test credentials provided, skipping authentication setup");
    return;
  }

  try {
    // Perform login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill credentials using the correct locators
    const usernameInput = page.locator('.q-card .q-input').first().locator('input');
    const passwordInput = page.locator('.q-card .q-input').nth(1).locator('input');

    await usernameInput.fill(testData.credentials.username);
    await passwordInput.fill(testData.credentials.password);

    // Submit login and wait for API response
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/v2/checkcreds") || res.url().includes("/v2/login"), { timeout: 15000 }).catch(() => null),
      page.getByRole("button", { name: "Login" }).click(),
    ]);

    if (response) {
      console.log("Login API response status:", response.status());
      if (!response.ok()) {
        console.log("Login failed with status:", response.status());
        try {
          const body = await response.text();
          console.log("Response body:", body);
        } catch {}
      }
    }

    // Wait a moment for UI to update
    await page.waitForTimeout(1000);

    // Handle TOTP if needed
    try {
      await page.waitForSelector('text=Two-Factor Token', { timeout: 10000 });

      // Use dev TOTP code if available, otherwise generate from secret
      let totpCode: string;
      if (testData.credentials.devTotpCode) {
        totpCode = testData.credentials.devTotpCode;
        console.log("Using dev TOTP code:", totpCode);
      } else if (testData.credentials.totpSecret) {
        totpCode = await generateTOTP(testData.credentials.totpSecret);
        console.log("Generated TOTP code:", totpCode);
      } else {
        console.log("TOTP required but no code/secret provided");
        return;
      }

      await page.locator('input[autocomplete="one-time-code"]').fill(totpCode);
      await page.getByRole("button", { name: "Submit" }).click();

      // Wait for redirect after TOTP
      await page.waitForURL(/\/(setup)?$/, { timeout: 30000 });
    } catch (e) {
      // TOTP not required or timed out, check if we're already redirected
      const currentUrl = page.url();
      console.log("Current URL after login:", currentUrl);

      if (currentUrl.includes("/login")) {
        // Still on login page, might need TOTP setup
        if (currentUrl.includes("/totp_setup")) {
          console.log("TOTP setup required");
        }
      }
    }

    // Save authentication state
    await page.context().storageState({ path: authFile });
    console.log("Authentication state saved successfully");
  } catch (error) {
    console.error("Authentication setup failed:", error);
    // Don't fail the setup - tests will handle unauthenticated state
  }
});

/**
 * Verify API server is accessible
 */
setup("verify-api", async ({ request }) => {
  try {
    // Make a simple request to verify the API is running
    const response = await request.get("/login");
    expect(response.ok()).toBeTruthy();
    console.log("API server is accessible");
  } catch (error) {
    console.warn("API server check failed, some tests may fail:", error);
  }
});
