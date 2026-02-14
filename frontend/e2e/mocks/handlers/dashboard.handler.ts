import { Page } from '@playwright/test';
import { createMockDashboardSummary, createMockMonthlyComparison } from '../data/dashboard';

export async function setupDashboardMock(page: Page) {
  await page.route(
    (url) => url.pathname === '/api/dashboard/summary',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const year = Number(reqUrl.searchParams.get('year') ?? 2026);
      const month = Number(reqUrl.searchParams.get('month') ?? 1);
      await route.fulfill({ json: createMockDashboardSummary(year, month) });
    }
  );

  await page.route(
    (url) => url.pathname === '/api/dashboard/monthly-comparison',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const year = Number(reqUrl.searchParams.get('year') ?? 2026);
      await route.fulfill({ json: createMockMonthlyComparison(year) });
    }
  );
}
