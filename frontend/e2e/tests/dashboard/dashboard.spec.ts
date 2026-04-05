import { test, expect } from '../../fixtures/base.fixture';

test.describe('Dashboard', () => {
  test('should display summary cards', async ({ dashboardPage }) => {
    const income = await dashboardPage.getSummaryValue('Income');
    expect(income).toContain('3,500');

    const expenses = await dashboardPage.getSummaryValue('Expenses');
    expect(expenses).toContain('85');

    const savings = await dashboardPage.getSummaryValue('Savings');
    expect(savings).toContain('0');

    const debt = await dashboardPage.getSummaryValue('Debt');
    expect(debt).toContain('0');
  });

  test('should display breakdown section', async ({ dashboardPage }) => {
    // Income is selected by default — its categories appear in the detail table
    await expect(dashboardPage.page.getByText('Employment (Net)', { exact: true })).toBeVisible();

    // Switch to Expenses — Groceries should now appear
    await dashboardPage.getNavigatorTile('Expenses').click();
    await expect(dashboardPage.page.getByText('Groceries', { exact: true })).toBeVisible();
  });

  test('should change year', async ({ dashboardPage }) => {
    // Mock returns hasData=false for any year other than 2026, so Income tracked becomes $0
    await dashboardPage.selectYear('2025');
    const income = await dashboardPage.getSummaryValue('Income');
    expect(income).toContain('0');
  });

  test('should change month', async ({ dashboardPage }) => {
    await dashboardPage.selectMonth('Jan');
    await expect(dashboardPage.getMonthTrigger()).toContainText('Jan');
  });

  test('should update detail panel title when switching tiles', async ({ dashboardPage }) => {
    // Default: Income detail panel is shown
    await expect(dashboardPage.getDetailPanelTitle()).toContainText('Income');

    // Click Expenses tile — detail panel title updates
    await dashboardPage.getNavigatorTile('Expenses').click();
    await expect(dashboardPage.getDetailPanelTitle()).toContainText('Expenses');

    // Click Savings tile
    await dashboardPage.getNavigatorTile('Savings').click();
    await expect(dashboardPage.getDetailPanelTitle()).toContainText('Savings');
  });

  test('should show categories for selected tile', async ({ dashboardPage }) => {
    // Expenses tile → Groceries visible
    await dashboardPage.getNavigatorTile('Expenses').click();
    await expect(dashboardPage.page.getByText('Groceries', { exact: true })).toBeVisible();

    // Back to Income → Employment (Net) visible, Groceries gone
    await dashboardPage.getNavigatorTile('Income').click();
    await expect(dashboardPage.page.getByText('Employment (Net)', { exact: true })).toBeVisible();
    await expect(dashboardPage.page.getByText('Groceries', { exact: true })).not.toBeVisible();
  });
});
