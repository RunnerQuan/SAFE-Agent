// @ts-nocheck
// Playwright Test Template
// Location: e2e/[feature].spec.ts
// E2E test structure with fixtures and assertions

import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/My App/);

    // Check main heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should navigate to about page', async ({ page }) => {
    // Click navigation link
    await page.getByRole('link', { name: 'About' }).click();

    // Verify navigation
    await expect(page).toHaveURL('/about');

    // Check content loaded
    await expect(page.getByText('About Us')).toBeVisible();
  });

  test('should submit form successfully', async ({ page }) => {
    // Navigate to form
    await page.goto('/contact');

    // Fill form fields
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByLabel('Message').fill('Hello, world!');

    // Submit form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success message
    await expect(page.getByText('Message sent!')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to page that might error
    await page.goto('/protected');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

// Visual regression test
test('visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});

// Selector Best Practices:
// ✅ Good - Role-based selectors
// page.getByRole('button', { name: 'Submit' });
// page.getByRole('link', { name: 'About' });
// page.getByRole('heading', { level: 1 });
//
// ✅ Good - Label-based for forms
// page.getByLabel('Email');
// page.getByPlaceholder('Enter your email');
//
// ✅ Good - Test IDs for complex elements
// page.getByTestId('user-menu');
//
// ❌ Avoid - CSS selectors
// page.locator('.btn-primary');
// page.locator('#submit');
