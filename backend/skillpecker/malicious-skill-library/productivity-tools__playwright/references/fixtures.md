# Playwright Fixtures Reference

Custom fixtures extend Playwright's test functionality with reusable setup and teardown logic.

## Built-in Fixtures

| Fixture       | Description           |
| ------------- | --------------------- |
| `page`        | Isolated browser page |
| `context`     | Browser context       |
| `browser`     | Browser instance      |
| `browserName` | Current browser name  |
| `request`     | API request context   |

## Custom Fixtures

### Authentication Fixture

```typescript
// e2e/fixtures.ts
import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
```

### Database Fixture

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

type DbFixtures = {
  db: PrismaClient;
  testUser: { id: string; email: string };
};

export const test = base.extend<DbFixtures>({
  db: async ({}, use) => {
    const prisma = new PrismaClient();
    await use(prisma);
    await prisma.$disconnect();
  },

  testUser: async ({ db }, use) => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    await use(user);

    // Cleanup after test
    await db.user.delete({ where: { id: user.id } });
  },
});
```

### Page Object Fixture

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';

type PageObjectFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<PageObjectFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});
```

### API Client Fixture

```typescript
// e2e/fixtures.ts
import { test as base, APIRequestContext } from '@playwright/test';

type ApiFixtures = {
  apiClient: APIRequestContext;
  authenticatedApi: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: 'http://localhost:3000/api',
    });
    await use(api);
    await api.dispose();
  },

  authenticatedApi: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: 'http://localhost:3000/api',
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.TEST_TOKEN}`,
      },
    });
    await use(api);
    await api.dispose();
  },
});
```

## Using Fixtures

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from './fixtures';

test('user can view dashboard', async ({ authenticatedPage, testUser }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.getByText(testUser.email)).toBeVisible();
});

test('admin can access settings', async ({ adminPage }) => {
  await adminPage.goto('/admin/settings');
  await expect(adminPage.getByRole('heading', { name: 'Admin Settings' })).toBeVisible();
});
```

## Worker Fixtures (Shared State)

```typescript
// For expensive setup shared across tests in a worker
import { test as base } from '@playwright/test';

type WorkerFixtures = {
  sharedAccount: { email: string; password: string };
};

export const test = base.extend<{}, WorkerFixtures>({
  sharedAccount: [
    async ({}, use) => {
      // Create account once per worker
      const account = await createTestAccount();
      await use(account);
      await deleteTestAccount(account.email);
    },
    { scope: 'worker' },
  ],
});
```

## Automatic Fixtures

```typescript
// Auto-use fixtures run for every test
export const test = base.extend({
  // Automatically inject for every test
  autoLogin: [
    async ({ page }, use) => {
      await page.goto('/login');
      await page.fill('[name=email]', 'auto@example.com');
      await page.fill('[name=password]', 'password');
      await page.click('button[type=submit]');
      await use();
    },
    { auto: true },
  ],
});
```
