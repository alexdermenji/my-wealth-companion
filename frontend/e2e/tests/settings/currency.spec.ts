import { test, expect } from '../../fixtures/base.fixture';

test.describe('Currency settings', () => {
  test('shows flag and ISO code in currency trigger', async ({ settingsPage }) => {
    // Default mock currency is $
    const trigger = settingsPage.getCurrencyTrigger();
    await expect(trigger).toContainText('🇺🇸');
    await expect(trigger).toContainText('USD');
  });

  test('dropdown lists all 10 currencies', async ({ settingsPage }) => {
    await settingsPage.getCurrencyTrigger().click();
    const options = settingsPage.page.getByRole('option');
    await expect(options).toHaveCount(10);
  });

  test('selecting GBP updates the trigger to show 🇬🇧 GBP', async ({ settingsPage }) => {
    await settingsPage.selectCurrency('GBP');
    await expect(settingsPage.getCurrencyTrigger()).toContainText('🇬🇧');
    await expect(settingsPage.getCurrencyTrigger()).toContainText('GBP');
  });

  test('selecting GBP sends £ as currency code to API', async ({ settingsPage }) => {
    let putBody: Record<string, unknown> | null = null;
    await settingsPage.page.route(
      (url) => url.pathname === '/api/settings',
      async (route, request) => {
        if (request.method() === 'PUT') {
          putBody = request.postDataJSON();
        }
        await route.fallback();
      }
    );

    await settingsPage.selectCurrency('GBP');
    await settingsPage.page.waitForTimeout(300);
    expect(putBody).toBeTruthy();
    expect((putBody as Record<string, unknown>).currency).toBe('£');
  });

  test('selecting SEK sends kr-sek as currency code to API', async ({ settingsPage }) => {
    let putBody: Record<string, unknown> | null = null;
    await settingsPage.page.route(
      (url) => url.pathname === '/api/settings',
      async (route, request) => {
        if (request.method() === 'PUT') {
          putBody = request.postDataJSON();
        }
        await route.fallback();
      }
    );

    await settingsPage.selectCurrency('SEK');
    await settingsPage.page.waitForTimeout(300);
    expect((putBody as Record<string, unknown>).currency).toBe('kr-sek');
  });
});

test.describe('Currency — end-to-end: settings → budget planning', () => {
  test('changing currency to £ shows £ symbol in budget totals', async ({ settingsPage, page }) => {
    // Change currency to GBP in settings
    await settingsPage.selectCurrency('GBP');
    await page.waitForTimeout(300);

    // Navigate to budget planning page
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Section totals and Remaining row should now show £
    const totalRows = page.locator('tr').filter({ hasText: 'Total' });
    await expect(totalRows.first()).toContainText('£');
  });

  test('changing currency to € shows € symbol in budget totals', async ({ settingsPage, page }) => {
    await settingsPage.selectCurrency('EUR');
    await page.waitForTimeout(300);

    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const totalRows = page.locator('tr').filter({ hasText: 'Total' });
    await expect(totalRows.first()).toContainText('€');
  });

  test('changing currency to € shows € in Remaining row', async ({ settingsPage, page }) => {
    await settingsPage.selectCurrency('EUR');
    await page.waitForTimeout(300);

    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const remainingRow = page.locator('tr').filter({ hasText: 'Remaining' });
    await expect(remainingRow).toContainText('€');
  });

  test('default $ currency shows $ in budget totals without any settings change', async ({ budgetPlanPage }) => {
    // Default mock settings has currency: '$'
    const totalRows = budgetPlanPage.page.locator('tr').filter({ hasText: 'Total' });
    await expect(totalRows.first()).toContainText('$');
  });
});
