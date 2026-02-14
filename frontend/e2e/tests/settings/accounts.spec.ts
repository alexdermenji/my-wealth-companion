import { test, expect } from '../../fixtures/base.fixture';

test.describe('Accounts Settings', () => {
  test('should display accounts table', async ({ settingsPage }) => {
    const rows = settingsPage.getAccountRows();
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('Bank Account');
    await expect(rows.nth(1)).toContainText('Cash on Hand');
    await expect(rows.nth(2)).toContainText('Credit Card 1');
  });

  test('should add new account', async ({ settingsPage }) => {
    await settingsPage.addAccount('Investment Portfolio', 'Investment');
    await settingsPage.page.waitForTimeout(300);

    const rows = settingsPage.getAccountRows();
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(3)).toContainText('Investment Portfolio');
  });

  test('should edit account', async ({ settingsPage }) => {
    await settingsPage.editAccount('Bank Account', 'Primary Bank');
    await settingsPage.page.waitForTimeout(300);

    await expect(settingsPage.getAccountRows().first()).toContainText('Primary Bank');
  });

  test('should delete account', async ({ settingsPage }) => {
    await settingsPage.deleteAccount('Cash on Hand');
    await settingsPage.page.waitForTimeout(300);

    const rows = settingsPage.getAccountRows();
    await expect(rows).toHaveCount(2);
  });
});
