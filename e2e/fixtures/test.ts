import { test as base, expect, Page, BrowserContext } from "@playwright/test";

// Environment variables for test configuration
const TEST_USERNAME = process.env.TEST_USERNAME || "tactical";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "tactical";
const TEST_TOTP_SECRET = process.env.TEST_TOTP_SECRET || "";
// In dev mode, use "sekret" as the literal TOTP code (not a secret to generate from)
const DEV_TOTP_CODE = process.env.DEV_TOTP_CODE || "sekret";

// Test data constants
export const testData = {
  credentials: {
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    totpSecret: TEST_TOTP_SECRET,
    devTotpCode: DEV_TOTP_CODE,
  },
  client: {
    name: "Test Client",
    description: "Test client for automated testing",
  },
  site: {
    name: "Test Site",
    description: "Test site for automated testing",
  },
  agent: {
    hostname: "TEST-AGENT",
    description: "Test agent for automated testing",
  },
};

// Extended test fixture with authentication support
export interface TestFixtures {
  authenticatedPage: Page;
  authContext: BrowserContext;
}

/**
 * Helper to generate TOTP code from secret
 * Uses the Web Crypto API to generate HMAC-SHA1 based TOTP
 */
export async function generateTOTP(secret: string): Promise<string> {
  if (!secret) {
    throw new Error("TOTP secret is required");
  }

  // Base32 decode helper
  const base32Decode = (input: string): Uint8Array => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const sanitized = input.replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
    let bits = "";

    for (const char of sanitized) {
      const index = alphabet.indexOf(char);
      if (index === -1) throw new Error(`Invalid base32 character: ${char}`);
      bits += index.toString(2).padStart(5, "0");
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
    }
    return bytes;
  };

  // HOTP algorithm implementation
  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBytes = new Uint8Array(8);
  let tempCounter = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tempCounter & 0xff;
    tempCounter = Math.floor(tempCounter / 256);
  }

  const keyBytes = base32Decode(secret);

  // Use Node.js crypto for HMAC-SHA1
  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha1", Buffer.from(keyBytes));
  hmac.update(Buffer.from(counterBytes));
  const hashBuffer = hmac.digest();

  // Convert Buffer to array for safe indexing
  const hash = Array.from(hashBuffer);
  const lastByte = hash[hash.length - 1];
  if (lastByte === undefined) throw new Error("Invalid hash");

  const offset = lastByte & 0x0f;
  const b0 = hash[offset] ?? 0;
  const b1 = hash[offset + 1] ?? 0;
  const b2 = hash[offset + 2] ?? 0;
  const b3 = hash[offset + 3] ?? 0;

  const binary = ((b0 & 0x7f) << 24) | ((b1 & 0xff) << 16) | ((b2 & 0xff) << 8) | (b3 & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Authentication helper for Playwright tests
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Perform login with username and password
   */
  async login(
    username: string = testData.credentials.username,
    password: string = testData.credentials.password,
    totpCode: string = testData.credentials.devTotpCode
  ): Promise<void> {
    // Navigate to login page
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");

    // Fill in credentials
    const usernameInput = this.page.locator('.q-card .q-input').first().locator('input');
    const passwordInput = this.page.locator('.q-card .q-input').nth(1).locator('input');

    await usernameInput.fill(username);
    await passwordInput.fill(password);

    // Click login button and wait for response
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => res.url().includes("/v2/checkcreds") || res.url().includes("/v2/login"), { timeout: 15000 }).catch(() => null),
      this.page.getByRole("button", { name: "Login" }).click(),
    ]);

    if (response) {
      console.log("Login API response status:", response.status());
    }

    // Wait a bit for any error notifications or TOTP dialog
    await this.page.waitForTimeout(1000);

    // Handle 2FA if TOTP dialog appears
    const totpDialog = this.page.locator('text=Two-Factor Token');
    if (await totpDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("TOTP dialog appeared, entering code:", totpCode);
      await this.page.locator('input[autocomplete="one-time-code"]').fill(totpCode);
      await this.page.getByRole("button", { name: "Submit" }).click();
    }

    // Check if redirected to TOTP setup (first time login)
    if (this.page.url().includes("/totp_setup")) {
      console.log("Redirected to TOTP setup page");
      return;
    }

    // Wait for navigation to dashboard or setup
    await this.page.waitForURL(/\/(setup|totp_setup)?$/, { timeout: 30000 });
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    // Check for presence of access_token in localStorage
    const token = await this.page.evaluate(() => localStorage.getItem("access_token"));
    return token !== null;
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    // Clear the auth token from localStorage
    await this.page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_name");
      localStorage.removeItem("name");
    });

    // Navigate to login
    await this.page.goto("/login");
  }

  /**
   * Set up authenticated state by setting token directly
   * This is faster than going through the login UI
   */
  async setupAuthenticatedState(token: string, username: string = "tactical"): Promise<void> {
    await this.page.evaluate(
      ({ token, username }) => {
        localStorage.setItem("access_token", JSON.stringify(token));
        localStorage.setItem("user_name", JSON.stringify(username));
      },
      { token, username }
    );
  }
}

/**
 * Extended test fixture with authentication support
 */
export const test = base.extend<TestFixtures>({
  // Authenticated page fixture
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);

    // Perform login
    await auth.login();

    // Use the authenticated page
    await use(page);

    // Cleanup
    await context.close();
  },

  authContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
});

export { expect };
