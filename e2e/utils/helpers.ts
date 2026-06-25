import { Page, expect } from "@playwright/test";

/**
 * Wait for Quasar loading bar to complete
 */
export async function waitForLoadingBar(page: Page, timeout: number = 10000): Promise<void> {
  try {
    // Wait for loading bar to appear and then disappear
    await page.waitForSelector(".q-loading-bar", { state: "hidden", timeout });
  } catch {
    // Loading bar may not appear for quick operations
  }
}

/**
 * Wait for any loading spinner to complete
 */
export async function waitForLoading(page: Page, timeout: number = 10000): Promise<void> {
  try {
    await page.waitForSelector(".q-loading, .q-inner-loading", { state: "hidden", timeout });
  } catch {
    // No loading indicator present
  }
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
}

/**
 * Take a screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png` });
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Get all text content from a table
 */
export async function getTableData(page: Page, tableSelector: string): Promise<string[][]> {
  const rows = await page.locator(`${tableSelector} tbody tr`).all();
  const data: string[][] = [];

  for (const row of rows) {
    const cells = await row.locator("td").allTextContents();
    data.push(cells);
  }

  return data;
}

/**
 * Wait for a specific notification message
 */
export async function waitForNotification(
  page: Page,
  message: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(`.q-notification:has-text("${message}")`, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Close all open notifications
 */
export async function closeAllNotifications(page: Page): Promise<void> {
  const closeButtons = page.locator(".q-notification .q-btn");
  const count = await closeButtons.count();

  for (let i = 0; i < count; i++) {
    try {
      await closeButtons.nth(i).click();
    } catch {
      // Notification may have auto-closed
    }
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      if (typeof urlPattern === "string") {
        return response.url().includes(urlPattern);
      }
      return urlPattern.test(response.url());
    },
    { timeout }
  );
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const box = await element.boundingBox();

  if (!box) return false;

  const viewport = page.viewportSize();
  if (!viewport) return false;

  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  );
}

/**
 * Retry an action until it succeeds
 */
export async function retry<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === "true" || process.env.CI === "1";
}

/**
 * Get current timestamp string for unique identifiers
 */
export function getTimestamp(): string {
  return Date.now().toString(36);
}

/**
 * Generate random test data
 */
export function generateTestName(prefix: string = "Test"): string {
  return `${prefix}_${getTimestamp()}`;
}

/**
 * Wait for Quasar dialog to be fully rendered
 */
export async function waitForDialogReady(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(".q-dialog:visible", { timeout });
  // Wait for any animations
  await page.waitForTimeout(300);
}

/**
 * Get form validation state
 */
export async function getFormValidationErrors(page: Page): Promise<string[]> {
  const errors = await page.locator(".q-field--error .q-field__messages, .text-negative").allTextContents();
  return errors.filter((e) => e.trim().length > 0);
}

/**
 * Fill form field by label
 */
export async function fillFieldByLabel(page: Page, label: string, value: string): Promise<void> {
  const field = page.locator(`.q-field:has(.q-field__label:text("${label}")) input`);
  await field.fill(value);
}

/**
 * Select option by label in a select field
 */
export async function selectOptionByLabel(
  page: Page,
  fieldLabel: string,
  optionText: string
): Promise<void> {
  const field = page.locator(`.q-field:has(.q-field__label:text("${fieldLabel}"))`);
  await field.click();
  await page.waitForSelector(".q-menu:visible");
  await page.locator(`.q-menu .q-item:has-text("${optionText}")`).click();
}
