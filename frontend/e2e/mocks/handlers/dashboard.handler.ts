import { Page } from '@playwright/test';
import { createMockDashboardSummary, createMockMonthlyComparison } from '../data/dashboard';

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

export async function setupDashboardMock(page: Page) {
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/get_dashboard_summary',
    async (route, request) => {
      const { p_year, p_month } = request.postDataJSON();
      await route.fulfill({ json: createMockDashboardSummary(p_year ?? 2026, p_month ?? 1) });
    }
  );

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/get_monthly_comparison',
    async (route, request) => {
      const { p_year } = request.postDataJSON();
      await route.fulfill({ json: createMockMonthlyComparison(p_year ?? 2026) });
    }
  );
}
