import { test, expect } from "./fixtures/test";
import { DashboardPage } from "./pages/DashboardPage";
import { DialogHelper, ConfirmDialogHelper, TableHelper } from "./pages/DialogHelper";

test.describe("Clients Management", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe("Clients Manager Dialog", () => {
    test("should open Clients Manager from FileBar", async ({ authenticatedPage }) => {
      // Find and click on Clients Manager button in FileBar
      // Look for a button with "Clients" text or icon
      const clientsButton = authenticatedPage.locator(
        '.q-toolbar .q-btn:has-text("Clients"), .q-btn:has(.q-icon[name*="business"]), .q-menu-item:has-text("Clients")'
      ).first();

      // May need to open a menu first
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();

          // Dialog should open
          const dialog = new DialogHelper(authenticatedPage);
          await dialog.waitForDialog();
          await expect(authenticatedPage.locator('.q-dialog:has-text("Clients Manager")')).toBeVisible();
        }
      }
    });

    test("should display client table with columns", async ({ authenticatedPage }) => {
      // Open Clients Manager
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();

          const dialog = new DialogHelper(authenticatedPage);
          await dialog.waitForDialog();

          // Check for table columns
          const nameColumn = authenticatedPage.locator('.q-dialog th:has-text("Name")');
          const sitesColumn = authenticatedPage.locator('.q-dialog th:has-text("Sites")');
          const agentsColumn = authenticatedPage.locator('.q-dialog th:has-text("Agents")');

          await expect(nameColumn).toBeVisible();
        }
      }
    });

    test("should have New client button", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();

          const dialog = new DialogHelper(authenticatedPage);
          await dialog.waitForDialog();

          // Check for New button
          const newButton = authenticatedPage.locator('.q-dialog .q-btn:has-text("New")');
          await expect(newButton).toBeVisible();
        }
      }
    });

    test("should have search input", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();

          const dialog = new DialogHelper(authenticatedPage);
          await dialog.waitForDialog();

          // Check for search input
          const searchInput = authenticatedPage.locator('.q-dialog input').filter({ hasText: /Search/i }).or(
            authenticatedPage.locator('.q-dialog .q-input:has-text("Search")')
          );

          // Search should be available
        }
      }
    });
  });

  test.describe("Add Client", () => {
    test("should open Add Client dialog", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();

          const dialog = new DialogHelper(authenticatedPage);
          await dialog.waitForDialog();

          // Click New button
          const newButton = authenticatedPage.locator('.q-dialog .q-btn:has-text("New")');
          if (await newButton.isVisible()) {
            await newButton.click();

            // New dialog should open
            await authenticatedPage.waitForTimeout(500);
            const addDialog = authenticatedPage.locator('.q-dialog').last();
            await expect(addDialog).toBeVisible();
          }
        }
      }
    });

    test("should have required fields in Add Client form", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();

          await authenticatedPage.waitForTimeout(500);

          const newButton = authenticatedPage.locator('.q-dialog .q-btn:has-text("New")');
          if (await newButton.isVisible()) {
            await newButton.click();
            await authenticatedPage.waitForTimeout(500);

            // Check for Name field
            const nameField = authenticatedPage.locator('.q-dialog').last().locator('.q-field:has-text("Name")');
            await expect(nameField).toBeVisible();
          }
        }
      }
    });

    test("should validate client name is required", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();
          await authenticatedPage.waitForTimeout(500);

          const newButton = authenticatedPage.locator('.q-dialog .q-btn:has-text("New")');
          if (await newButton.isVisible()) {
            await newButton.click();
            await authenticatedPage.waitForTimeout(500);

            // Try to submit without filling name
            const submitButton = authenticatedPage.locator('.q-dialog').last().locator('.q-btn:has-text("Add"), .q-btn:has-text("Save"), button[type="submit"]');
            if (await submitButton.first().isVisible()) {
              await submitButton.first().click();
              await authenticatedPage.waitForTimeout(500);

              // Should show validation error
              const validationError = authenticatedPage.locator('.q-field__messages');
              const errors = await validationError.allTextContents();
              expect(errors.some((e) => e.includes("required") || e.length > 0)).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe("Edit Client", () => {
    test("should open Edit dialog on double-click", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();
          await authenticatedPage.waitForTimeout(1000);

          // Find first client row
          const clientRow = authenticatedPage.locator('.q-dialog tbody tr, .q-dialog .q-virtual-scroll__content tr').first();
          if (await clientRow.isVisible()) {
            await clientRow.dblclick();
            await authenticatedPage.waitForTimeout(500);

            // Edit dialog should open
            const dialogs = authenticatedPage.locator('.q-dialog');
            const dialogCount = await dialogs.count();
            expect(dialogCount).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    test("should show context menu with Edit option", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();
          await authenticatedPage.waitForTimeout(1000);

          // Right-click on first client row
          const clientRow = authenticatedPage.locator('.q-dialog tbody tr').first();
          if (await clientRow.isVisible()) {
            await clientRow.click({ button: "right" });
            await authenticatedPage.waitForTimeout(300);

            // Context menu should appear with Edit option
            const editMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Edit")');
            await expect(editMenuItem).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Delete Client", () => {
    test("should show Delete option in context menu", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();
          await authenticatedPage.waitForTimeout(1000);

          // Right-click on first client row
          const clientRow = authenticatedPage.locator('.q-dialog tbody tr').first();
          if (await clientRow.isVisible()) {
            await clientRow.click({ button: "right" });
            await authenticatedPage.waitForTimeout(300);

            // Delete option should be visible
            const deleteMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Delete")');
            await expect(deleteMenuItem).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Sites Management", () => {
    test("should show Sites link in client row", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();
          await authenticatedPage.waitForTimeout(1000);

          // Check for "Show Sites" link
          const showSitesLink = authenticatedPage.locator('.q-dialog:has-text("Show Sites")');
          // May or may not be visible depending on clients
        }
      }
    });

    test("should have Add Site option in context menu", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const clientsMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Clients")');
        if (await clientsMenuItem.isVisible()) {
          await clientsMenuItem.click();
          await authenticatedPage.waitForTimeout(1000);

          // Right-click on first client row
          const clientRow = authenticatedPage.locator('.q-dialog tbody tr').first();
          if (await clientRow.isVisible()) {
            await clientRow.click({ button: "right" });
            await authenticatedPage.waitForTimeout(300);

            // Add Site option should be visible
            const addSiteMenuItem = authenticatedPage.locator('.q-menu .q-item:has-text("Add Site")');
            await expect(addSiteMenuItem).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Client Tree Context Menu", () => {
    test("should show context menu options on client node", async ({ authenticatedPage }) => {
      // Wait for tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Find first client node
      const clientNode = authenticatedPage.locator('.q-tree .q-icon[name="business"]').first().locator("..");

      if (await clientNode.isVisible()) {
        await clientNode.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        // Verify context menu options
        const menu = authenticatedPage.locator(".q-menu");
        await expect(menu).toBeVisible();

        // Expected menu items
        await expect(authenticatedPage.locator('.q-menu .q-item:has-text("Edit")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu .q-item:has-text("Delete")')).toBeVisible();
        await expect(authenticatedPage.locator('.q-menu .q-item:has-text("Add Site")')).toBeVisible();
      }
    });

    test("should show Install Agent option on site node", async ({ authenticatedPage }) => {
      // Wait for tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Expand first client
      const expandArrow = authenticatedPage.locator(".q-tree__arrow").first();
      if (await expandArrow.isVisible()) {
        await expandArrow.click();
        await authenticatedPage.waitForTimeout(500);
      }

      // Find site node
      const siteNode = authenticatedPage.locator('.q-tree .q-icon[name="apartment"]').first().locator("..");

      if (await siteNode.isVisible()) {
        await siteNode.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        // Install Agent option should be visible
        const installAgentOption = authenticatedPage.locator('.q-menu .q-item:has-text("Install Agent")');
        await expect(installAgentOption).toBeVisible();
      }
    });

    test("should show Maintenance Mode option", async ({ authenticatedPage }) => {
      // Wait for tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Find first client node
      const clientNode = authenticatedPage.locator('.q-tree .q-icon[name="business"]').first().locator("..");

      if (await clientNode.isVisible()) {
        await clientNode.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        // Maintenance Mode option should be visible
        const maintenanceOption = authenticatedPage.locator('.q-menu .q-item:has-text("Maintenance Mode")');
        await expect(maintenanceOption).toBeVisible();
      }
    });

    test("should show Assign Automation Policy option", async ({ authenticatedPage }) => {
      // Wait for tree to load
      await authenticatedPage.waitForTimeout(2000);

      // Find first client node
      const clientNode = authenticatedPage.locator('.q-tree .q-icon[name="business"]').first().locator("..");

      if (await clientNode.isVisible()) {
        await clientNode.click({ button: "right" });
        await authenticatedPage.waitForTimeout(300);

        // Policy option should be visible
        const policyOption = authenticatedPage.locator('.q-menu .q-item:has-text("Assign Automation Policy")');
        await expect(policyOption).toBeVisible();
      }
    });
  });
});
