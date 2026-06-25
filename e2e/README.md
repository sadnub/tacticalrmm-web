# Playwright Test Environment Setup

This document provides comprehensive instructions for setting up and running Playwright tests for the Tactical RMM web application.

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Tactical RMM backend running (API server)
- Quasar dev server running on localhost:9000

## Installation

1. Install project dependencies:

```bash
npm install
```

2. Install Playwright browsers:

```bash
npm run test:install
```

3. Install system dependencies (Linux only):

```bash
npm run test:install-deps
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Test Configuration
BASE_URL=http://localhost:9000
TEST_USERNAME=tactical
TEST_PASSWORD=tactical
TEST_TOTP_SECRET=your_totp_secret_here  # Optional: Base32 encoded TOTP secret

# CI Configuration
CI=false
```

## Running Tests

### Basic Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests headlessly |
| `npm run test:headed` | Run tests with visible browser |
| `npm run test:ui` | Open Playwright Test UI |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:report` | View HTML test report |

### Specific Test Suites

| Command | Description |
|---------|-------------|
| `npm run test:auth` | Authentication tests |
| `npm run test:clients` | Client management tests |
| `npm run test:agents` | Agent management tests |
| `npm run test:features` | Feature tests |

### Browser-Specific Tests

| Command | Description |
|---------|-------------|
| `npm run test:chrome` | Run in Chrome only |
| `npm run test:firefox` | Run in Firefox only |
| `npm run test:safari` | Run in Safari (WebKit) only |
| `npm run test:mobile` | Run on mobile viewports |

### Running Individual Tests

```bash
# Run a specific test file
npx playwright test e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "login"

# Run tests with specific tag
npx playwright test --grep @smoke
```

## Test Structure

```
e2e/
├── .auth/                    # Authentication state storage (gitignored)
├── fixtures/
│   └── test.ts               # Test fixtures, data, and auth helpers
├── pages/
│   ├── index.ts              # Page object model exports
│   ├── LoginPage.ts          # Login page interactions
│   ├── DashboardPage.ts      # Dashboard page interactions
│   └── DialogHelper.ts       # Dialog and table utilities
├── utils/
│   └── helpers.ts            # Utility functions
├── global.setup.ts           # Global test setup (authentication)
├── auth.spec.ts              # Authentication tests
├── dashboard.spec.ts         # Dashboard tests
├── clients.spec.ts           # Client management tests
├── agents.spec.ts            # Agent management tests
├── settings.spec.ts          # Settings tests
├── components.spec.ts        # UI component tests
└── README.md                 # This file
```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- Login page UI verification
- Credential validation
- TOTP (2FA) handling
- Session management
- SSO provider display

### 2. Dashboard Tests (`dashboard.spec.ts`)
- Layout verification
- Client tree navigation
- Agent table functionality
- Tab switching
- Splitter behavior

### 3. Client Management Tests (`clients.spec.ts`)
- Clients Manager dialog
- Add/Edit/Delete clients
- Sites management
- Context menu operations

### 4. Agent Management Tests (`agents.spec.ts`)
- Agent table display
- Search and filter
- Agent selection
- Context menu actions
- Sub-table tabs

### 5. Settings Tests (`settings.spec.ts`)
- Menu navigation
- Global settings dialog
- User preferences
- Various manager dialogs

### 6. Component Tests (`components.spec.ts`)
- TacticalTable functionality
- QTree (client tree)
- QSplitter behavior
- QTabs switching
- Form components
- Dialog handling

## Page Object Models

### LoginPage
```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.fillCredentials("username", "password");
await loginPage.clickLogin();
```

### DashboardPage
```typescript
const dashboard = new DashboardPage(page);
await dashboard.goto();
await dashboard.waitForLoad();
await dashboard.selectClient("Client Name");
await dashboard.searchAgents("hostname");
```

### DialogHelper
```typescript
const dialog = new DialogHelper(page);
await dialog.waitForDialog();
await dialog.fillInput("Name", "Test Value");
await dialog.submit();
```

### TableHelper
```typescript
const table = new TableHelper(page, ".tactical-table");
await table.clickRow(0);
await table.sortByColumn("Hostname");
const rowCount = await table.getRowCount();
```

## Authentication

The test suite includes automatic authentication handling:

1. **Global Setup**: `global.setup.ts` runs before tests to authenticate and save state
2. **Authenticated Fixture**: Use `authenticatedPage` fixture for pre-authenticated tests
3. **Manual Auth**: Use `AuthHelper` class for custom authentication flows

```typescript
// Using authenticated fixture
test("my test", async ({ authenticatedPage }) => {
  // Already logged in
});

// Manual authentication
test("manual auth", async ({ page }) => {
  const auth = new AuthHelper(page);
  await auth.login("user", "pass", "totp_secret");
});
```

## Utility Functions

```typescript
import { 
  waitForLoadingBar,
  waitForNotification,
  getTableData,
  fillFieldByLabel 
} from "./utils/helpers";

// Wait for loading
await waitForLoadingBar(page);

// Check notifications
const hasNotification = await waitForNotification(page, "Success");

// Get table data
const data = await getTableData(page, ".q-table");
```

## CI/CD Integration

The Playwright configuration includes:

- **Multiple browser testing**: Chromium, Firefox, WebKit
- **Parallel execution**: 4 workers locally, 1 in CI
- **Retry logic**: 1 retry locally, 2 in CI
- **Reporting**: HTML, JSON, and JUnit formats
- **Artifacts**: Screenshots and videos on failure
- **Tracing**: Trace files on first retry

### GitHub Actions Example

```yaml
- name: Run Playwright tests
  run: npx playwright test
  env:
    BASE_URL: http://localhost:9000
    TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure dev server is running on port 9000 |
| Authentication failures | Check credentials in `.env` file |
| Element not found | Wait for element visibility, check selectors |
| Timeout errors | Increase timeout in playwright.config.ts |
| TOTP failures | Verify TOTP secret is correct Base32 format |

### Debug Mode

```bash
# Step through tests
npm run test:debug

# Run with inspector
PWDEBUG=1 npm test

# Run specific test in debug
npx playwright test e2e/auth.spec.ts --debug
```

### Viewing Traces

```bash
# Show trace viewer for failed tests
npx playwright show-trace test-results/trace.zip
```

### Test Reports

```bash
# Open HTML report
npm run test:report

# The report is also available at test-results/index.html
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection when possible
2. **Wait for elements** to be visible before interacting
3. **Use page object models** for complex page interactions
4. **Keep tests independent** - each test should set up its own state
5. **Use meaningful descriptions** for test names
6. **Clean up test data** after tests complete
7. **Avoid hard-coded waits** - use proper waitFor conditions
8. **Use the authenticated fixture** instead of logging in each test

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from "./fixtures/test";
import { DashboardPage } from "./pages/DashboardPage";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test("should do something", async ({ authenticatedPage }) => {
    // Test implementation
    await expect(authenticatedPage.locator(".element")).toBeVisible();
  });
});
```

### Adding Page Objects

```typescript
// e2e/pages/MyPage.ts
import { Page, Locator, expect } from "@playwright/test";

export class MyPage {
  readonly page: Page;
  readonly myElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.myElement = page.locator(".my-element");
  }

  async doSomething(): Promise<void> {
    await this.myElement.click();
  }
}
```
