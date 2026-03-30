# Playwright Selector Patterns

## Locator Priority (Best to Worst)

### 1. Role-Based Selectors (Recommended)

```typescript
// Buttons
page.getByRole('button', { name: 'Submit' });
page.getByRole('button', { name: /submit/i }); // Regex

// Links
page.getByRole('link', { name: 'Home' });
page.getByRole('link', { name: 'Learn more', exact: true });

// Headings
page.getByRole('heading', { level: 1 });
page.getByRole('heading', { name: 'Welcome' });

// Form elements
page.getByRole('textbox', { name: 'Email' });
page.getByRole('checkbox', { name: 'Remember me' });
page.getByRole('combobox', { name: 'Country' });
page.getByRole('radio', { name: 'Option A' });

// Navigation
page.getByRole('navigation');
page.getByRole('menu');
page.getByRole('menuitem', { name: 'Settings' });

// Regions
page.getByRole('main');
page.getByRole('complementary'); // sidebar
page.getByRole('contentinfo'); // footer
```

### 2. Label-Based Selectors

```typescript
// Form labels
page.getByLabel('Email');
page.getByLabel('Password');
page.getByLabel(/remember me/i);

// Placeholder
page.getByPlaceholder('Search...');
page.getByPlaceholder('Enter your email');

// Alt text (images)
page.getByAltText('Company logo');
page.getByAltText(/profile/i);

// Title attribute
page.getByTitle('Close dialog');
```

### 3. Text-Based Selectors

```typescript
// Exact text
page.getByText('Welcome back');
page.getByText('Welcome back', { exact: true });

// Regex
page.getByText(/welcome/i);
page.getByText(/\d+ items/);

// Substring (default behavior)
page.getByText('Welcome'); // Matches "Welcome back"
```

### 4. Test ID Selectors

```typescript
// data-testid attribute
page.getByTestId('submit-button');
page.getByTestId('user-avatar');

// Custom test ID attribute (configure in playwright.config.ts)
// use: { testIdAttribute: 'data-test' }
page.getByTestId('custom-id');
```

### 5. CSS/XPath Selectors (Last Resort)

```typescript
// CSS
page.locator('.card');
page.locator('#main-content');
page.locator('[data-state="open"]');
page.locator('button.primary');

// XPath
page.locator('//button[contains(text(), "Submit")]');
page.locator('//div[@class="card"]//button');
```

## Filtering & Chaining

### Filter by Text

```typescript
page.getByRole('listitem').filter({ hasText: 'Product Name' });

page.getByRole('listitem').filter({ hasNotText: 'Out of stock' });
```

### Filter by Locator

```typescript
// Find list item that contains a "Buy" button
page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Buy' }) });

// Find card without a badge
page.locator('.card').filter({ hasNot: page.locator('.badge') });
```

### Chaining

```typescript
// Scope within element
page.getByRole('article').getByRole('heading');

// Multiple levels
page.getByRole('main').getByRole('article').first().getByRole('button');
```

## Nth Selection

```typescript
// First, last
page.getByRole('listitem').first();
page.getByRole('listitem').last();

// Index (0-based)
page.getByRole('listitem').nth(2);

// Count
const count = await page.getByRole('listitem').count();
```

## Frame Handling

```typescript
// By name or URL
const frame = page.frame('payment-iframe');
const frame = page.frameLocator('iframe[name="payment"]');

// Interact within frame
await frame.getByRole('button', { name: 'Pay' }).click();
```

## Shadow DOM

```typescript
// Pierce shadow DOM (enabled by default)
page.locator('my-component').getByRole('button');

// CSS with shadow piercing
page.locator('my-component >> button.submit');
```

## Dynamic Elements

```typescript
// Wait for element
await page.getByRole('dialog').waitFor();
await page.getByRole('button').waitFor({ state: 'visible' });

// Conditional presence
if (await page.getByRole('dialog').isVisible()) {
  await page.getByRole('button', { name: 'Close' }).click();
}

// Retry until stable
await expect(page.getByText('Loading')).toBeHidden();
await expect(page.getByRole('table')).toBeVisible();
```

## Best Practices

1. **Prefer semantic selectors** (role, label, text) over structural (CSS, XPath)
2. **Use exact matching** when text is ambiguous
3. **Add test IDs** only when semantic selectors fail
4. **Filter chains** for complex selections
5. **Avoid index-based** selection (fragile)
6. **Use regex** for dynamic/varying text
