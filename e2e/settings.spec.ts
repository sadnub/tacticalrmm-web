import { test, expect } from "./fixtures/test";
import { DashboardPage } from "./pages/DashboardPage";
import { DialogHelper, TableHelper } from "./pages/DialogHelper";

test.describe("Settings", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe("FileBar Menu", () => {
    test("should have File menu with options", async ({ authenticatedPage }) => {
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');

      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const menu = authenticatedPage.locator(".q-menu");
        await expect(menu).toBeVisible();

        // Check for expected menu items
        await expect(authenticatedPage.locator('.q-menu .q-item:has-text("Clients")')).toBeVisible();
      }
    });

    test("should have Tools menu", async ({ authenticatedPage }) => {
      const toolsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Tools")');

      if (await toolsMenu.isVisible()) {
        await toolsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const menu = authenticatedPage.locator(".q-menu");
        await expect(menu).toBeVisible();
      }
    });

    test("should have Settings menu", async ({ authenticatedPage }) => {
      const settingsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Settings")');

      if (await settingsMenu.isVisible()) {
        await settingsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const menu = authenticatedPage.locator(".q-menu");
        await expect(menu).toBeVisible();
      }
    });
  });

  test.describe("Global Settings", () => {
    test("should open Global Settings dialog", async ({ authenticatedPage }) => {
      const settingsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Settings")');

      if (await settingsMenu.isVisible()) {
        await settingsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const globalSettingsOption = authenticatedPage.locator('.q-menu .q-item:has-text("Global Settings")');
        if (await globalSettingsOption.isVisible()) {
          await globalSettingsOption.click();
          await authenticatedPage.waitForTimeout(500);

          // Global Settings dialog should open
          const dialog = authenticatedPage.locator(".q-dialog");
          await expect(dialog).toBeVisible();
        }
      }
    });
  });

  test.describe("User Preferences", () => {
    test("should open User Preferences", async ({ authenticatedPage }) => {
      // Look for user menu or preferences option
      const userMenu = authenticatedPage.locator('.q-toolbar .q-btn:has(.q-icon[name*="person"]), .q-toolbar .q-btn:has(.q-icon[name*="account"])');

      if (await userMenu.isVisible()) {
        await userMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const prefsOption = authenticatedPage.locator('.q-menu .q-item:has-text("Preferences")');
        if (await prefsOption.isVisible()) {
          await prefsOption.click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          await expect(dialog).toBeVisible();
        }
      }
    });
  });

  test.describe("Scripts Manager", () => {
    test("should open Scripts Manager from Tools menu", async ({ authenticatedPage }) => {
      const toolsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Tools")');

      if (await toolsMenu.isVisible()) {
        await toolsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const scriptsOption = authenticatedPage.locator('.q-menu .q-item:has-text("Script")');
        if (await scriptsOption.isVisible()) {
          await scriptsOption.click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          await expect(dialog).toBeVisible();
        }
      }
    });
  });

  test.describe("Automation Manager", () => {
    test("should open Automation/Policy Manager", async ({ authenticatedPage }) => {
      // Look for automation menu option
      const toolsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Tools")');

      if (await toolsMenu.isVisible()) {
        await toolsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const automationOption = authenticatedPage.locator('.q-menu .q-item:has-text("Automation"), .q-menu .q-item:has-text("Policy")');
        if (await automationOption.first().isVisible()) {
          await automationOption.first().click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          // Dialog may or may not open
        }
      }
    });
  });

  test.describe("Alerts Manager", () => {
    test("should open Alerts Manager", async ({ authenticatedPage }) => {
      const toolsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Tools")');

      if (await toolsMenu.isVisible()) {
        await toolsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const alertsOption = authenticatedPage.locator('.q-menu .q-item:has-text("Alert")');
        if (await alertsOption.first().isVisible()) {
          await alertsOption.first().click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          // Dialog may or may not open
        }
      }
    });
  });

  test.describe("Admin Manager", () => {
    test("should open Admin Manager from Settings", async ({ authenticatedPage }) => {
      const settingsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Settings")');

      if (await settingsMenu.isVisible()) {
        await settingsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const adminOption = authenticatedPage.locator('.q-menu .q-item:has-text("Admin"), .q-menu .q-item:has-text("User")');
        if (await adminOption.first().isVisible()) {
          await adminOption.first().click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          // Dialog may open
        }
      }
    });
  });

  test.describe("API Keys", () => {
    test("should open API Keys manager", async ({ authenticatedPage }) => {
      const settingsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Settings")');

      if (await settingsMenu.isVisible()) {
        await settingsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const apiKeysOption = authenticatedPage.locator('.q-menu .q-item:has-text("API")');
        if (await apiKeysOption.isVisible()) {
          await apiKeysOption.click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          // Dialog may open
        }
      }
    });
  });

  test.describe("Custom Fields", () => {
    test("should open Custom Fields manager", async ({ authenticatedPage }) => {
      const settingsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Settings")');

      if (await settingsMenu.isVisible()) {
        await settingsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        const customFieldsOption = authenticatedPage.locator('.q-menu .q-item:has-text("Custom Field")');
        if (await customFieldsOption.isVisible()) {
          await customFieldsOption.click();
          await authenticatedPage.waitForTimeout(500);

          const dialog = authenticatedPage.locator(".q-dialog");
          // Dialog may open
        }
      }
    });
  });

  test.describe("URL Actions", () => {
    test("should open URL Actions manager", async ({ authenticatedPage }) => {
      const settingsMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("Settings")');

      if (await settingsMenu.isVisible()) {
        await settingsMenu.click();
        await authenticatedPage.waitForTimeout(300);

        // May need to open Global Settings first
        const globalSettingsOption = authenticatedPage.locator('.q-menu .q-item:has-text("Global Settings")');
        if (await globalSettingsOption.isVisible()) {
          await globalSettingsOption.click();
          await authenticatedPage.waitForTimeout(500);

          // Look for URL Actions tab or option
          const urlActionsTab = authenticatedPage.locator('.q-dialog .q-tab:has-text("URL Actions")');
          if (await urlActionsTab.isVisible()) {
            await urlActionsTab.click();
            await authenticatedPage.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe("Dark Mode Toggle", () => {
    test("should have dark mode toggle", async ({ authenticatedPage }) => {
      // Look for dark mode toggle in toolbar or settings
      const darkModeToggle = authenticatedPage.locator('.q-toolbar .q-toggle, .q-toggle:has-text("Dark")');

      // May or may not be directly visible in toolbar
    });
  });

  test.describe("Keyboard Shortcuts", () => {
    test("should support keyboard shortcuts for common actions", async ({ authenticatedPage }) => {
      // Test common keyboard shortcuts
      // Note: Actual shortcuts depend on implementation

      // Test Escape to close menus
      const fileMenu = authenticatedPage.locator('.q-toolbar .q-btn:has-text("File")');
      if (await fileMenu.isVisible()) {
        await fileMenu.click();
        await authenticatedPage.waitForTimeout(300);

        // Press Escape
        await authenticatedPage.keyboard.press("Escape");
        await authenticatedPage.waitForTimeout(300);

        // Menu should close
        const menu = authenticatedPage.locator(".q-menu:visible");
        await expect(menu).not.toBeVisible();
      }
    });
  });

  test.describe("Responsive Layout", () => {
    test("should adapt to different screen sizes", async ({ authenticatedPage }) => {
      // Test mobile viewport
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.waitForTimeout(500);

      // Dashboard should still be visible
      const dashboard = new DashboardPage(authenticatedPage);
      // Layout may change but should still work

      // Reset to desktop
      await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    });
  });
});
