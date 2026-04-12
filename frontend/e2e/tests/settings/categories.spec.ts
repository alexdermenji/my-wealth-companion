import { test, expect } from '../../fixtures/base.fixture';

test.describe('Settings Page', () => {
  test('should show the streamlined settings sections', async ({ settingsPage }) => {
    await expect(settingsPage.heading).toBeVisible();
    await expect(settingsPage.getGeneralInput('Start Year')).toHaveValue('2026');
    await expect(settingsPage.getGeneralInput('Start Month')).toHaveValue('1');
    await expect(settingsPage.getGeneralInput('Currency')).toHaveValue('$');
    await expect(settingsPage.getAccountRows()).toHaveCount(3);
  });

  test('should not display budget category management', async ({ settingsPage }) => {
    await expect(settingsPage.page.getByText('Budget Categories')).toHaveCount(0);
    await expect(settingsPage.page.getByText('Income Categories')).toHaveCount(0);
    await expect(settingsPage.page.getByText('Expenses Categories')).toHaveCount(0);
    await expect(settingsPage.page.getByText('Savings Categories')).toHaveCount(0);
    await expect(settingsPage.page.getByText('Debt Categories')).toHaveCount(0);
  });

  test('should not show old category entries on settings', async ({ settingsPage }) => {
    await expect(settingsPage.page.getByText('Rent')).toHaveCount(0);
    await expect(settingsPage.page.getByText('Groceries')).toHaveCount(0);
    await expect(settingsPage.page.getByText('Emergency Fund')).toHaveCount(0);
  });
});
