import { test, expect } from '../../fixtures/base.fixture';

test.describe('Navigation', () => {
  test('should navigate to Dashboard', async ({ page, appNav }) => {
    await page.goto('/transactions');
    await appNav.navigateTo('Dashboard');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
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
    await expect(page.getByText('Edit Budget', { exact: true }).first()).toBeVisible();
  });

  test('should navigate to Net Worth', async ({ page, appNav }) => {
    await page.goto('/');
    await appNav.navigateTo('Net Worth');
    await expect(page).toHaveURL('/net-worth');
    await expect(page.getByText('Total Assets')).toBeVisible();
    await expect(page.getByText('Total Liabilities')).toBeVisible();
  });

  test('should navigate to Settings', async ({ page, appNav }) => {
    await page.goto('/');
    await appNav.navigateToSettings();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should highlight active link', async ({ page, appNav }) => {
    await page.goto('/transactions');
    await appNav.expectActiveLink('Transactions');
  });
});
