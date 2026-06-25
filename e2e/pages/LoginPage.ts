import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Login page
 */
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly passwordToggle: Locator;
  readonly totpDialog: Locator;
  readonly totpInput: Locator;
  readonly totpSubmitButton: Locator;
  readonly totpCancelButton: Locator;
  readonly ssoSection: Locator;
  readonly tacticalRmmTitle: Locator;
  readonly loginCard: Locator;

  constructor(page: Page) {
    this.page = page;

    // Login form elements
    this.loginCard = page.locator(".q-card");
    this.tacticalRmmTitle = page.locator("text=Tactical RMM");
    this.usernameInput = page.locator('.q-card .q-input').first().locator('input');
    this.passwordInput = page.locator('.q-card .q-input').nth(1).locator('input');
    this.passwordToggle = page.locator(".q-card .q-input .q-icon.cursor-pointer").first();
    this.loginButton = page.getByRole("button", { name: "Login" });

    // TOTP dialog elements
    this.totpDialog = page.locator(".q-dialog");
    this.totpInput = page.locator('input[autocomplete="one-time-code"]');
    this.totpSubmitButton = page.getByRole("button", { name: "Submit" });
    this.totpCancelButton = page.getByRole("button", { name: "Cancel" });

    // SSO section
    this.ssoSection = page.locator("text=Log in with SSO");
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Fill in the login form
   */
  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Click the login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Perform a complete login
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.clickLogin();
  }

  /**
   * Fill in the TOTP code
   */
  async fillTOTP(code: string): Promise<void> {
    await this.totpInput.fill(code);
  }

  /**
   * Submit the TOTP dialog
   */
  async submitTOTP(): Promise<void> {
    await this.totpSubmitButton.click();
  }

  /**
   * Cancel the TOTP dialog
   */
  async cancelTOTP(): Promise<void> {
    await this.totpCancelButton.click();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  /**
   * Check if the login page is displayed
   */
  async isDisplayed(): Promise<boolean> {
    await this.page.waitForLoadState("networkidle");
    return await this.tacticalRmmTitle.isVisible();
  }

  /**
   * Check if TOTP dialog is displayed
   */
  async isTOTPDialogDisplayed(): Promise<boolean> {
    return await this.totpDialog.isVisible();
  }

  /**
   * Check if SSO options are available
   */
  async hasSSOOptions(): Promise<boolean> {
    return await this.ssoSection.isVisible();
  }

  /**
   * Get the SSO provider buttons
   */
  async getSSOProviders(): Promise<Locator> {
    return this.page.locator(".q-list .q-item");
  }

  /**
   * Verify the login page UI elements are present
   */
  async verifyPageElements(): Promise<void> {
    await expect(this.tacticalRmmTitle).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.passwordToggle).toBeVisible();
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = await this.page.locator(".q-field__messages").allTextContents();
    return errors.filter((error) => error.trim().length > 0);
  }
}
