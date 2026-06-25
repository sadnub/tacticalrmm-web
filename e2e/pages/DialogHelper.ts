import { Page, Locator, expect } from "@playwright/test";

/**
 * Helper class for interacting with Quasar dialogs
 */
export class DialogHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the currently open dialog
   */
  getDialog(): Locator {
    return this.page.locator(".q-dialog:visible").last();
  }

  /**
   * Check if any dialog is open
   */
  async isDialogOpen(): Promise<boolean> {
    return await this.page.locator(".q-dialog:visible").isVisible();
  }

  /**
   * Wait for a dialog to open
   */
  async waitForDialog(timeout: number = 10000): Promise<Locator> {
    await this.page.waitForSelector(".q-dialog:visible", { timeout });
    return this.getDialog();
  }

  /**
   * Close the dialog by clicking the close button
   */
  async closeDialog(): Promise<void> {
    const closeButton = this.page.locator('.q-dialog:visible .q-btn[aria-label*="Close"], .q-dialog:visible .q-bar .q-btn:has(.q-icon[name="close"])');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Get the dialog title
   */
  async getDialogTitle(): Promise<string> {
    const titleElement = this.getDialog().locator(".q-bar, .q-card__section").first();
    return await titleElement.textContent() || "";
  }

  /**
   * Click a button in the dialog by text
   */
  async clickDialogButton(buttonText: string): Promise<void> {
    await this.getDialog().getByRole("button", { name: buttonText }).click();
  }

  /**
   * Fill an input field in the dialog by label
   */
  async fillInput(label: string, value: string): Promise<void> {
    const input = this.getDialog().locator(`.q-field:has-text("${label}") input, .q-field:has-text("${label}") textarea`);
    await input.fill(value);
  }

  /**
   * Select an option from a dropdown by label
   */
  async selectOption(label: string, optionText: string): Promise<void> {
    // Click the select field
    const selectField = this.getDialog().locator(`.q-field:has-text("${label}")`);
    await selectField.click();

    // Wait for menu to appear and click the option
    await this.page.waitForSelector(".q-menu:visible", { timeout: 5000 });
    await this.page.locator(`.q-menu:visible .q-item:has-text("${optionText}")`).click();
  }

  /**
   * Toggle a checkbox in the dialog
   */
  async toggleCheckbox(label: string): Promise<void> {
    const checkbox = this.getDialog().locator(`.q-checkbox:has-text("${label}"), label:has-text("${label}")`);
    await checkbox.click();
  }

  /**
   * Check if a checkbox is checked
   */
  async isCheckboxChecked(label: string): Promise<boolean> {
    const checkbox = this.getDialog().locator(`.q-checkbox:has-text("${label}")`);
    const ariaChecked = await checkbox.getAttribute("aria-checked");
    return ariaChecked === "true";
  }

  /**
   * Get all form field labels in the dialog
   */
  async getFormLabels(): Promise<string[]> {
    const labels = await this.getDialog().locator(".q-field__label").allTextContents();
    return labels.map((l) => l.trim());
  }

  /**
   * Verify dialog has expected fields
   */
  async verifyFormFields(expectedFields: string[]): Promise<void> {
    for (const field of expectedFields) {
      const fieldElement = this.getDialog().locator(`.q-field:has-text("${field}")`);
      await expect(fieldElement).toBeVisible();
    }
  }

  /**
   * Submit the dialog form
   */
  async submit(): Promise<void> {
    const submitButton = this.getDialog().locator('button[type="submit"], .q-btn:has-text("Save"), .q-btn:has-text("Submit"), .q-btn:has-text("Add")');
    await submitButton.first().click();
  }

  /**
   * Cancel the dialog
   */
  async cancel(): Promise<void> {
    const cancelButton = this.getDialog().locator('.q-btn:has-text("Cancel")');
    await cancelButton.click();
  }

  /**
   * Wait for dialog to close
   */
  async waitForDialogClose(timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(".q-dialog:visible", { state: "hidden", timeout });
  }

  /**
   * Get validation errors in the dialog
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = await this.getDialog().locator(".q-field__messages, .text-negative").allTextContents();
    return errors.filter((e) => e.trim().length > 0);
  }
}

/**
 * Helper for confirmation dialogs
 */
export class ConfirmDialogHelper extends DialogHelper {
  /**
   * Confirm the dialog (click OK/Yes/Delete)
   */
  async confirm(): Promise<void> {
    const confirmButton = this.getDialog().locator('.q-btn:has-text("OK"), .q-btn:has-text("Yes"), .q-btn:has-text("Delete"), .q-btn:has-text("Confirm")');
    await confirmButton.first().click();
  }

  /**
   * Decline the dialog (click Cancel/No)
   */
  async decline(): Promise<void> {
    const declineButton = this.getDialog().locator('.q-btn:has-text("Cancel"), .q-btn:has-text("No")');
    await declineButton.first().click();
  }

  /**
   * Get the confirmation message
   */
  async getMessage(): Promise<string> {
    const message = await this.getDialog().locator(".q-card__section").textContent();
    return message || "";
  }
}

/**
 * Helper for table components
 */
export class TableHelper {
  readonly page: Page;
  readonly tableLocator: Locator;

  constructor(page: Page, tableSelector: string = ".q-table, .tactical-table") {
    this.page = page;
    this.tableLocator = page.locator(tableSelector).first();
  }

  /**
   * Get the number of rows in the table
   */
  async getRowCount(): Promise<number> {
    return await this.tableLocator.locator("tbody tr, .q-virtual-scroll__content tr").count();
  }

  /**
   * Get cell value by row index and column name
   */
  async getCellValue(rowIndex: number, columnName: string): Promise<string> {
    const headerCells = await this.tableLocator.locator("thead th").allTextContents();
    const columnIndex = headerCells.findIndex((h) => h.includes(columnName));
    if (columnIndex === -1) throw new Error(`Column "${columnName}" not found`);

    const cell = this.tableLocator.locator(`tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${columnIndex + 1})`);
    return (await cell.textContent()) || "";
  }

  /**
   * Click on a row by index
   */
  async clickRow(rowIndex: number): Promise<void> {
    await this.tableLocator.locator(`tbody tr:nth-child(${rowIndex + 1})`).click();
  }

  /**
   * Double-click on a row by index
   */
  async doubleClickRow(rowIndex: number): Promise<void> {
    await this.tableLocator.locator(`tbody tr:nth-child(${rowIndex + 1})`).dblclick();
  }

  /**
   * Right-click on a row by index
   */
  async rightClickRow(rowIndex: number): Promise<void> {
    await this.tableLocator.locator(`tbody tr:nth-child(${rowIndex + 1})`).click({ button: "right" });
  }

  /**
   * Find row containing text
   */
  async findRow(text: string): Promise<Locator> {
    return this.tableLocator.locator(`tbody tr:has-text("${text}")`).first();
  }

  /**
   * Check if table has data
   */
  async hasData(): Promise<boolean> {
    const rowCount = await this.getRowCount();
    return rowCount > 0;
  }

  /**
   * Get all column headers
   */
  async getColumnHeaders(): Promise<string[]> {
    return await this.tableLocator.locator("thead th").allTextContents();
  }

  /**
   * Sort by column
   */
  async sortByColumn(columnName: string): Promise<void> {
    const header = this.tableLocator.locator(`thead th:has-text("${columnName}")`);
    await header.click();
  }

  /**
   * Search in table (if search input exists)
   */
  async search(term: string): Promise<void> {
    const searchInput = this.page.locator('.q-input input[type="text"]').first();
    await searchInput.fill(term);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    const clearButton = this.page.locator('.q-input .q-icon[name*="clear"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }
}
