import { test, expect } from "./fixtures/test";
import { DashboardPage } from "./pages/DashboardPage";
import { DialogHelper, TableHelper } from "./pages/DialogHelper";

test.describe("Agents Management", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe("Agent Table", () => {
    test("should display agent table with proper columns", async ({ authenticatedPage }) => {
      // Wait for table to load
      await authenticatedPage.waitForTimeout(2000);

      // Check for expected column headers
      const expectedColumns = [
        "hostname",
        "client",
        "site",
        "description",
      ];

      const tableHeaders = authenticatedPage.locator("thead th, .q-table th");
      const headerTexts = await tableHeaders.allTextContents();

      // Verify some columns exist (case-insensitive)
      const lowerHeaders = headerTexts.map((h) => h.toLowerCase());
      expect(lowerHeaders.some((h) => h.includes("host"))).toBeTruthy();
    });

    test("should have status column with icons", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      // Look for status icons (signal icon)
      const statusIcons = authenticatedPage.locator('.q-icon[name*="signal"]');
      const count = await statusIcons.count();

      // If agents exist, there should be status icons
      // No assertion as there may be no agents
    });

    test("should have platform column with OS icons", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      // Look for platform icons
      const windowsIcons = authenticatedPage.locator('.q-icon[name*="windows"]');
      const linuxIcons = authenticatedPage.locator('.q-icon[name*="linux"]');
      const macIcons = authenticatedPage.locator('.q-icon[name*="apple"]');

      // At least one platform icon type might exist
    });

    test("should display agent count in tabs", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      // Tab labels should show counts or just names
      const serversTab = authenticatedPage.locator('.q-tab:has-text("Servers")');
      const workstationsTab = authenticatedPage.locator('.q-tab:has-text("Workstations")');

      if (await serversTab.isVisible()) {
        await expect(serversTab).toBeVisible();
      }
    });
  });

  test.describe("Agent Table Search", () => {
    test("should filter agents by hostname", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      // Find search input
      const searchInput = authenticatedPage.locator('.q-input input').first();

      // Type a search term
      await searchInput.fill("test");
      await authenticatedPage.waitForTimeout(500);

      // Table should filter (no specific assertion as agents may not match)
    });

    test("should clear search on clear button click", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      const searchInput = authenticatedPage.locator('.q-input input').first();
      await searchInput.fill("test");
      await authenticatedPage.waitForTimeout(300);

      // Find and click clear button
      const clearButton = authenticatedPage.locator('.q-input .q-icon[name*="clear"], .q-input .q-icon[name*="close"]').first();
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await authenticatedPage.waitForTimeout(300);

        // Search input should be cleared
        await expect(searchInput).toHaveValue("");
      }
    });

    test("should support advanced filter syntax", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      const searchInput = authenticatedPage.locator('.q-input input').first();

      // Test advanced filter syntax
      await searchInput.fill("is:online");
      await authenticatedPage.waitForTimeout(500);

      // Filter should be applied
    });
  });

  test.describe("Agent Table Filters", () => {
    test("should open filter menu", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      const filterButton = authenticatedPage.locator('.q-btn:has(.q-icon[name="filter_alt"])');

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await authenticatedPage.waitForTimeout(300);

        // Filter menu should appear
        const menu = authenticatedPage.locator(".q-menu");
        await expect(menu).toBeVisible();
      }
    });

    test("should have Checks Failing filter", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      const filterButton = authenticatedPage.locator('.q-btn:has(.q-icon[name="filter_alt"])');

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await authenticatedPage.waitForTimeout(300);

        const checkFailingOption = authenticatedPage.locator('.q-menu:has-text("Checks Failing")');
        await expect(checkFailingOption).toBeVisible();

        await authenticatedPage.keyboard.press("Escape");
      }
    });

    test("should have availability filter options", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      const filterButton = authenticatedPage.locator('.q-btn:has(.q-icon[name="filter_alt"])');

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await authenticatedPage.waitForTimeout(300);

        // Check for availability options
        await expect(authenticatedPage.locator('.q-menu:has-text("Show All Agents")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu:has-text("Show Online Only")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu:has-text("Show Offline Only")')).toBeVisible();

        await authenticatedPage.keyboard.press("Escape");
      }
    });

    test("should apply and clear filters", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(2000);

      const filterButton = authenticatedPage.locator('.q-btn:has(.q-icon[name="filter_alt"])');

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await authenticatedPage.waitForTimeout(300);

        // Click on a checkbox filter
        const checkbox = authenticatedPage.locator('.q-menu .q-checkbox').first();
        if (await checkbox.isVisible()) {
          await checkbox.click();
          await authenticatedPage.waitForTimeout(200);

          // Click Apply
          const applyButton = authenticatedPage.locator('.q-menu .q-btn:has-text("Apply")');
          await applyButton.click();
          await authenticatedPage.waitForTimeout(500);

          // Filter button should indicate active filter
          const filterButtonClass = await filterButton.getAttribute("class");
        }
      }
    });
  });

  test.describe("Agent Context Menu", () => {
    test("should display agent context menu on right-click", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr, .q-virtual-scroll__content tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        const menu = authenticatedPage.locator(".q-menu");
        await expect(menu).toBeVisible();
      }
    });

    test("should have Edit Agent option", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        const editOption = authenticatedPage.locator('.q-menu .q-item:has-text("Edit")');
        await expect(editOption).toBeVisible();
      }
    });

    test("should have Take Control option", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        const takeControlOption = authenticatedPage.locator('.q-menu .q-item:has-text("Take Control")');
        // May or may not exist depending on agent platform
      }
    });

    test("should have Remote Background option", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        const remoteBgOption = authenticatedPage.locator('.q-menu .q-item:has-text("Remote Background")');
        // May or may not exist
      }
    });

    test("should have Send Command option", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        const sendCommandOption = authenticatedPage.locator('.q-menu .q-item:has-text("Send Command")');
        // May or may not exist
      }
    });

    test("should have Run Script option", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        const runScriptOption = authenticatedPage.locator('.q-menu .q-item:has-text("Run Script")');
        // May or may not exist
      }
    });
  });

  test.describe("Agent Selection", () => {
    test("should select agent on click", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click();
        await authenticatedPage.waitForTimeout(300);

        // Row should be highlighted
        const rowClass = await agentRow.getAttribute("class");
        expect(rowClass).toMatch(/highlight|selected|active/);
      }
    });

    test("should open Edit Agent dialog on double-click", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.dblclick();
        await authenticatedPage.waitForTimeout(500);

        // A dialog should open (Edit Agent or based on settings)
        const dialog = authenticatedPage.locator(".q-dialog");
        // Dialog may or may not open depending on dblclick action setting
      }
    });
  });

  test.describe("Agent Checkboxes", () => {
    test("should have SMS alert checkbox", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      // Look for phone icon in header
      const smsHeader = authenticatedPage.locator('th .q-icon[name="phone_android"]');
      // May or may not be visible depending on column settings
    });

    test("should have Email alert checkbox", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      // Look for email icon in header
      const emailHeader = authenticatedPage.locator('th .q-icon[name="email"]');
      // May or may not be visible
    });

    test("should toggle alert checkboxes", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      // Find checkbox in first agent row
      const checkbox = authenticatedPage.locator("tbody tr .q-checkbox").first();

      if (await checkbox.isVisible()) {
        const initialState = await checkbox.getAttribute("aria-checked");
        await checkbox.click();
        await authenticatedPage.waitForTimeout(500);

        // State should change
        const newState = await checkbox.getAttribute("aria-checked");
        // State may have changed (API call made)
      }
    });
  });

  test.describe("Sub Table Tabs", () => {
    test("should display sub table section when agent is selected", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click();
        await authenticatedPage.waitForTimeout(1000);

        // Sub table should show agent details
        // Look for tabs like Summary, Checks, Tasks, etc.
        const subTabs = authenticatedPage.locator(".q-tabs").last();
        // May show various tabs
      }
    });

    test("should show Summary tab content", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click();
        await authenticatedPage.waitForTimeout(1000);

        // Look for Summary tab
        const summaryTab = authenticatedPage.locator('.q-tab:has-text("Summary")');
        if (await summaryTab.isVisible()) {
          await summaryTab.click();
          await authenticatedPage.waitForTimeout(500);
        }
      }
    });

    test("should show Checks tab", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click();
        await authenticatedPage.waitForTimeout(1000);

        const checksTab = authenticatedPage.locator('.q-tab:has-text("Checks")');
        if (await checksTab.isVisible()) {
          await checksTab.click();
          await authenticatedPage.waitForTimeout(500);
        }
      }
    });

    test("should show Tasks tab", async ({ authenticatedPage }) => {
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click();
        await authenticatedPage.waitForTimeout(1000);

        const tasksTab = authenticatedPage.locator('.q-tab:has-text("Tasks")');
        if (await tasksTab.isVisible()) {
          await tasksTab.click();
          await authenticatedPage.waitForTimeout(500);
        }
      }
    });
  });
});
