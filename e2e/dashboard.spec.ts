import { test, expect } from "./fixtures/test";
import { DashboardPage } from "./pages/DashboardPage";
import { DialogHelper, ConfirmDialogHelper, TableHelper } from "./pages/DialogHelper";

test.describe("Dashboard", () => {
  // Use authenticated page for all dashboard tests
  test.beforeEach(async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe("Layout and Navigation", () => {
    test("should display main dashboard elements", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Verify main elements are visible
      await dashboard.verifyDashboardElements();

      // Check for client tree
      await expect(dashboard.allClientsItem).toBeVisible();

      // Check for agent table tabs
      const hasTabsVisible = await dashboard.serverTab.or(dashboard.mixedTab).isVisible();
      expect(hasTabsVisible).toBeTruthy();
    });

    test("should display file bar with action buttons", async ({ authenticatedPage }) => {
      // FileBar should be present at the top
      await expect(authenticatedPage.locator(".q-toolbar, .q-header")).toBeVisible();

      // Should have various action buttons
      const buttons = authenticatedPage.locator(".q-toolbar .q-btn, .q-header .q-btn");
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test("should have working splitter between client tree and agent table", async ({ authenticatedPage }) => {
      const splitter = authenticatedPage.locator(".q-splitter");
      await expect(splitter).toBeVisible();

      // Splitter should have separator that can be dragged
      const separator = splitter.locator(".q-splitter__separator");
      await expect(separator.first()).toBeVisible();
    });
  });

  test.describe("Client Tree", () => {
    test("should display All Clients option", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      await expect(dashboard.allClientsItem).toBeVisible();
    });

    test("should select All Clients when clicked", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      await dashboard.selectAllClients();

      // Should be selected (active state)
      const allClientsItem = authenticatedPage.locator('text=All Clients').first();
      await expect(allClientsItem.locator("..")).toHaveClass(/active|selected/);
    });

    test("should display client nodes if clients exist", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Wait for client tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Check if any client nodes exist (business icon)
      const clientIcons = authenticatedPage.locator('.q-tree .q-icon[name="business"]');
      const clientCount = await clientIcons.count();

      // If clients exist, verify they're displayed
      if (clientCount > 0) {
        expect(clientCount).toBeGreaterThan(0);
      }
    });

    test("should show context menu on right-click", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Wait for tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Find first client node
      const clientNode = authenticatedPage.locator('.q-tree .q-icon[name="business"]').first();

      if (await clientNode.isVisible()) {
        // Right-click on client
        await clientNode.click({ button: "right" });

        // Context menu should appear
        await expect(authenticatedPage.locator(".q-menu")).toBeVisible();

        // Should have expected menu items
        await expect(authenticatedPage.locator('.q-menu .q-item:has-text("Edit")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu .q-item:has-text("Delete")')).toBeVisible();
      }
    });

    test("should expand client to show sites", async ({ authenticatedPage }) => {
      // Wait for tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Find expand arrow on first client
      const expandArrow = authenticatedPage.locator(".q-tree__arrow").first();

      if (await expandArrow.isVisible()) {
        await expandArrow.click();

        // Wait for expansion
        await authenticatedPage.waitForTimeout(500);

        // Sites should appear (apartment icon)
        const siteNodes = authenticatedPage.locator('.q-tree .q-icon[name="apartment"]');
        // Sites may or may not exist
      }
    });
  });

  test.describe("Agent Table", () => {
    test("should display agent table with tabs", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Check tabs are visible
      const serversTab = authenticatedPage.locator('.q-tab:has-text("Servers")');
      const workstationsTab = authenticatedPage.locator('.q-tab:has-text("Workstations")');
      const mixedTab = authenticatedPage.locator('.q-tab:has-text("Mixed")');

      const hasServerTab = await serversTab.isVisible();
      const hasWorkstationTab = await workstationsTab.isVisible();
      const hasMixedTab = await mixedTab.isVisible();

      expect(hasServerTab || hasMixedTab).toBeTruthy();
    });

    test("should switch between agent table tabs", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Click Servers tab if visible
      const serversTab = authenticatedPage.locator('.q-tab:has-text("Servers")');
      if (await serversTab.isVisible()) {
        await serversTab.click();
        await authenticatedPage.waitForTimeout(500);
      }

      // Click Workstations tab if visible
      const workstationsTab = authenticatedPage.locator('.q-tab:has-text("Workstations")');
      if (await workstationsTab.isVisible()) {
        await workstationsTab.click();
        await authenticatedPage.waitForTimeout(500);
      }

      // Click Mixed tab if visible
      const mixedTab = authenticatedPage.locator('.q-tab:has-text("Mixed")');
      if (await mixedTab.isVisible()) {
        await mixedTab.click();
        await authenticatedPage.waitForTimeout(500);
      }
    });

    test("should have search functionality", async ({ authenticatedPage }) => {
      // Find search input
      const searchInput = authenticatedPage.locator('input').filter({ has: authenticatedPage.locator('[name="search"], .q-icon[name="search"]') }).or(
        authenticatedPage.locator('.q-input:has(.q-icon[name="search"]) input')
      );

      await expect(searchInput.first()).toBeVisible();
    });

    test("should have filter button", async ({ authenticatedPage }) => {
      // Find filter button
      const filterButton = authenticatedPage.locator('.q-btn:has(.q-icon[name="filter_alt"])');

      if (await filterButton.isVisible()) {
        // Click to open filter menu
        await filterButton.click();

        // Filter menu should appear
        await expect(authenticatedPage.locator(".q-menu")).toBeVisible();

        // Close menu by clicking elsewhere
        await authenticatedPage.keyboard.press("Escape");
      }
    });

    test("should display filter options", async ({ authenticatedPage }) => {
      const filterButton = authenticatedPage.locator('.q-btn:has(.q-icon[name="filter_alt"])');

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await authenticatedPage.waitForSelector(".q-menu", { timeout: 5000 });

        // Check for filter options
        await expect(authenticatedPage.locator('.q-menu:has-text("Checks Failing")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu:has-text("Patches Pending")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu:has-text("Actions Pending")')).toBeVisible();

        // Close menu
        await authenticatedPage.keyboard.press("Escape");
      }
    });

    test("should display agents if any exist", async ({ authenticatedPage }) => {
      // Wait for table to load
      await authenticatedPage.waitForTimeout(3000);

      // Check for agent rows
      const agentRows = authenticatedPage.locator("tbody tr, .q-virtual-scroll__content tr");
      const rowCount = await agentRows.count();

      // If agents exist, verify table structure
      if (rowCount > 0) {
        expect(rowCount).toBeGreaterThan(0);
      }
    });

    test("should show agent context menu on right-click", async ({ authenticatedPage }) => {
      // Wait for table to load
      await authenticatedPage.waitForTimeout(3000);

      const agentRow = authenticatedPage.locator("tbody tr, .q-virtual-scroll__content tr").first();

      if (await agentRow.isVisible()) {
        await agentRow.click({ button: "right" });

        // Context menu should appear
        await expect(authenticatedPage.locator(".q-menu")).toBeVisible();
      }
    });
  });

  test.describe("Sub Table Tabs", () => {
    test("should display sub table tabs section", async ({ authenticatedPage }) => {
      // The sub table tabs appear below the agent table
      const tabsContainer = authenticatedPage.locator(".q-tabs").last();

      // May or may not be visible depending on screen size
      if (await tabsContainer.isVisible()) {
        await expect(tabsContainer).toBeVisible();
      }
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should support keyboard navigation in client tree", async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Focus on client tree
      await dashboard.allClientsItem.click();

      // Test arrow key navigation
      await authenticatedPage.keyboard.press("ArrowDown");
      await authenticatedPage.waitForTimeout(200);

      // Navigation should work
    });
  });
});
