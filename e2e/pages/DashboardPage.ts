import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Dashboard page
 */
export class DashboardPage {
  readonly page: Page;

  // Main layout elements
  readonly fileBar: Locator;
  readonly clientTree: Locator;
  readonly agentTable: Locator;
  readonly subTableTabs: Locator;
  readonly mainSplitter: Locator;

  // Client tree elements
  readonly allClientsItem: Locator;
  readonly clientNodes: Locator;
  readonly siteNodes: Locator;

  // Agent table elements
  readonly agentTableSearch: Locator;
  readonly agentTableFilterButton: Locator;
  readonly serverTab: Locator;
  readonly workstationTab: Locator;
  readonly mixedTab: Locator;
  readonly agentRows: Locator;
  readonly agentTableLoading: Locator;

  // FileBar elements
  readonly fileBarButtons: Locator;
  readonly agentCountDisplay: Locator;
  readonly alertsIcon: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main layout
    this.fileBar = page.locator(".q-page").first();
    this.clientTree = page.locator(".q-tree");
    this.agentTable = page.locator(".tactical-table, [class*='tactical-table']").first();
    this.subTableTabs = page.locator(".q-tabs").last();
    this.mainSplitter = page.locator(".q-splitter");

    // Client tree
    this.allClientsItem = page.locator("text=All Clients");
    this.clientNodes = page.locator(".q-tree__node");
    this.siteNodes = page.locator('.q-tree__node .q-icon[name="apartment"]');

    // Agent table
    this.agentTableSearch = page.locator('input[class*="q-input"]').filter({ hasText: /Search/i });
    this.agentTableFilterButton = page.locator('button .q-icon[name="filter_alt"], .q-btn:has(.q-icon[name="filter_alt"])');
    this.serverTab = page.locator('.q-tab:has-text("Servers")');
    this.workstationTab = page.locator('.q-tab:has-text("Workstations")');
    this.mixedTab = page.locator('.q-tab:has-text("Mixed")');
    this.agentRows = page.locator(".q-table tbody tr, .q-virtual-scroll__content tr");
    this.agentTableLoading = page.locator(".q-inner-loading");

    // FileBar
    this.fileBarButtons = page.locator(".q-toolbar .q-btn");
    this.agentCountDisplay = page.locator('text=/\\d+ Servers|\\d+ Workstations/');
    this.alertsIcon = page.locator('.q-icon[name*="notification"], .q-icon[name*="warning"]');
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for the dashboard to fully load
   */
  async waitForLoad(): Promise<void> {
    // Wait for the client tree to be present
    await this.page.waitForSelector(".q-tree, text=All Clients", { timeout: 30000 });
    // Wait for agent table to appear
    await this.page.waitForSelector('.q-tab:has-text("Servers"), .q-tab:has-text("Mixed")', { timeout: 30000 });
  }

  /**
   * Check if dashboard is displayed
   */
  async isDisplayed(): Promise<boolean> {
    try {
      await this.waitForLoad();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click on "All Clients" in the tree
   */
  async selectAllClients(): Promise<void> {
    await this.allClientsItem.click();
  }

  /**
   * Select a client by name
   */
  async selectClient(clientName: string): Promise<void> {
    await this.page.locator(`.q-tree__node:has-text("${clientName}")`).first().click();
  }

  /**
   * Select a site by name
   */
  async selectSite(siteName: string): Promise<void> {
    await this.page.locator(`.q-tree__node:has-text("${siteName}")`).click();
  }

  /**
   * Expand a client node to show sites
   */
  async expandClient(clientName: string): Promise<void> {
    const clientNode = this.page.locator(`.q-tree__node:has-text("${clientName}")`).first();
    const expandIcon = clientNode.locator(".q-tree__arrow");
    if (await expandIcon.isVisible()) {
      await expandIcon.click();
    }
  }

  /**
   * Right-click on a client/site to open context menu
   */
  async openContextMenu(nodeName: string): Promise<void> {
    const node = this.page.locator(`.q-tree__node:has-text("${nodeName}")`).first();
    await node.click({ button: "right" });
  }

  /**
   * Search for agents in the table
   */
  async searchAgents(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator('input').filter({ hasText: /Search/i }).or(
      this.page.locator('.q-input input').first()
    );
    await searchInput.fill(searchTerm);
  }

  /**
   * Clear agent search
   */
  async clearSearch(): Promise<void> {
    const clearButton = this.page.locator('.q-input .q-icon[name*="clear"], .q-input .q-icon[name*="close"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  /**
   * Switch agent table tab
   */
  async switchTab(tab: "server" | "workstation" | "mixed"): Promise<void> {
    switch (tab) {
      case "server":
        await this.serverTab.click();
        break;
      case "workstation":
        await this.workstationTab.click();
        break;
      case "mixed":
        await this.mixedTab.click();
        break;
    }
  }

  /**
   * Get the count of agents in the table
   */
  async getAgentCount(): Promise<number> {
    const rows = await this.agentRows.count();
    return rows;
  }

  /**
   * Select an agent by hostname
   */
  async selectAgent(hostname: string): Promise<void> {
    await this.page.locator(`tr:has-text("${hostname}")`).first().click();
  }

  /**
   * Double-click an agent to open it
   */
  async openAgent(hostname: string): Promise<void> {
    await this.page.locator(`tr:has-text("${hostname}")`).first().dblclick();
  }

  /**
   * Right-click an agent to open context menu
   */
  async openAgentContextMenu(hostname: string): Promise<void> {
    await this.page.locator(`tr:has-text("${hostname}")`).first().click({ button: "right" });
  }

  /**
   * Open the filter menu
   */
  async openFilterMenu(): Promise<void> {
    await this.agentTableFilterButton.click();
  }

  /**
   * Apply a filter from the filter menu
   */
  async applyFilter(filterName: string): Promise<void> {
    await this.openFilterMenu();
    await this.page.locator(`text=${filterName}`).click();
    await this.page.locator('button:has-text("Apply")').click();
  }

  /**
   * Get all client names from the tree
   */
  async getClientNames(): Promise<string[]> {
    const clients = await this.page.locator('.q-tree__node .q-icon[name="business"]').locator("..").allTextContents();
    return clients.map((c) => c.trim());
  }

  /**
   * Check if a context menu item exists
   */
  async hasContextMenuItem(itemText: string): Promise<boolean> {
    return await this.page.locator(`.q-menu .q-item:has-text("${itemText}")`).isVisible();
  }

  /**
   * Click a context menu item
   */
  async clickContextMenuItem(itemText: string): Promise<void> {
    await this.page.locator(`.q-menu .q-item:has-text("${itemText}")`).click();
  }

  /**
   * Verify main dashboard elements are present
   */
  async verifyDashboardElements(): Promise<void> {
    await expect(this.allClientsItem).toBeVisible();
    await expect(this.serverTab.or(this.mixedTab)).toBeVisible();
  }
}
