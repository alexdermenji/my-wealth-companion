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
    const title = dashboardPage.getBreakdownTitle();
    await expect(title).toContainText('Breakdown');

    await expect(dashboardPage.page.getByText('Employment (Net)')).toBeVisible();
    await expect(dashboardPage.page.getByText('Groceries')).toBeVisible();
  });

  test('should change year', async ({ dashboardPage }) => {
    await dashboardPage.selectYear('2025');
    const title = dashboardPage.getBreakdownTitle();
    await expect(title).toContainText('2025');
  });

  test('should change month', async ({ dashboardPage }) => {
    await dashboardPage.selectMonth('Jan');
    const title = dashboardPage.getBreakdownTitle();
    await expect(title).toContainText('Jan');
  });

  test('should show bar chart', async ({ dashboardPage }) => {
    const chartCard = dashboardPage.getChartCard('Income vs Expenses');
    await expect(chartCard).toBeVisible();
    await expect(chartCard.locator('.recharts-responsive-container')).toBeVisible();
  });

  test('should show pie chart empty message when no expenses', async ({ dashboardPage }) => {
    // Select a month with no expense data
    await dashboardPage.selectMonth('Dec');
    await expect(dashboardPage.getPieEmptyMessage()).toBeVisible();
  });
});
