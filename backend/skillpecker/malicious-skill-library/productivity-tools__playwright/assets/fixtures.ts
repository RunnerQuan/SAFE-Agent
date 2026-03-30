// @ts-nocheck
// Playwright Fixtures Template
// Location: e2e/fixtures.ts
// Custom test fixtures with authentication states

import { test as base, expect, Page } from '@playwright/test';

// Define custom fixture types
type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

type DataFixtures = {
  testUser: { email: string; password: string };
  testData: Record<string, unknown>;
};

// Extend base test with custom fixtures
export const test = base.extend<AuthFixtures & DataFixtures>({
  // Authenticated user page
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Admin user page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Test user credentials
  testUser: async ({}, use) => {
    await use({
      email: 'test@example.com',
      password: 'TestPassword123!',
    });
  },

  // Shared test data
  testData: async ({}, use) => {
    await use({
      productId: 'test-product-1',
      orderId: 'test-order-1',
    });
  },
});

export { expect };

// Usage in tests:
//
// import { test, expect } from './fixtures';
//
// test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
//   await authenticatedPage.goto('/dashboard');
//   await expect(authenticatedPage.getByRole('heading')).toContainText('Dashboard');
// });
//
// test('admin can access admin panel', async ({ adminPage }) => {
//   await adminPage.goto('/admin');
//   await expect(adminPage).toHaveURL('/admin');
// });
