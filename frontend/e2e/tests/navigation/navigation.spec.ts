import { test, expect } from '../../fixtures/base.fixture';

test.describe('Navigation', () => {
  test('should navigate to Dashboard', async ({ page, appNav }) => {
    await page.goto('/transactions');
    await appNav.navigateTo('Dashboard');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Budget Dashboard' })).toBeVisible();
  });

  test('should navigate to Transactions', async ({ page, appNav }) => {
    await page.goto('/');
    await appNav.navigateTo('Transactions');
    await expect(page).toHaveURL('/transactions');
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
  });

  test('should navigate to Budget Plan', async ({ page, appNav }) => {
    await page.goto('/');
    await appNav.navigateTo('Budget Plan');
    await expect(page).toHaveURL('/budget');
    await expect(page.getByRole('heading', { name: 'Budget Planning' })).toBeVisible();
  });

  test('should navigate to Settings', async ({ page, appNav }) => {
    await page.goto('/');
    await appNav.navigateTo('Settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should highlight active link', async ({ page, appNav }) => {
    await page.goto('/transactions');
    await appNav.expectActiveLink('Transactions');
  });
});
