import { test, expect } from '../../fixtures/base.fixture';

test.describe('Dashboard', () => {
  test('shows the Net Worth chart with all three series', async ({ dashboardPage }) => {
    await expect(dashboardPage.getChartLegendItem('Assets')).toBeVisible();
    await expect(dashboardPage.getChartLegendItem('Liabilities')).toBeVisible();
    await expect(dashboardPage.getChartLegendItem('Net Worth')).toBeVisible();
  });

  test('shows current net worth from latest data point', async ({ dashboardPage }) => {
    // Apr 2026: Assets(28250+95500=123750) - Liabilities(68500) = 55,250
    await expect(dashboardPage.page.getByText(/55,250/)).toBeVisible();
  });

  test('shows gain since earliest data point', async ({ dashboardPage }) => {
    // Jan net worth = 25000+90000-70000 = 45000; Apr = 55250; gain = +10250
    await expect(dashboardPage.page.getByText(/10,250/)).toBeVisible();
  });
});
