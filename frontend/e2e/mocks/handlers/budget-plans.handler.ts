import { Page } from '@playwright/test';
import type { BudgetPlan } from '../../../src/features/budget/types';
import { mockBudgetPlans } from '../data/budget-plans';

export interface BudgetPlansMockOptions {
  initialData?: BudgetPlan[];
}

function getEqParam(url: URL, col: string): string | null {
  const val = url.searchParams.get(col);
  return val?.startsWith('eq.') ? val.slice(3) : null;
}

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

// Convert frontend BudgetPlan shape to flat DB rows
function planToRows(p: BudgetPlan) {
  return Object.entries(p.months).map(([month, amount]) => ({
    CategoryId: p.categoryId,
    Year: p.year,
    Month: Number(month),
    Amount: amount,
    UserId: 'e2e-user-id',
  }));
}

export async function setupBudgetPlansMock(page: Page, options: BudgetPlansMockOptions = {}) {
  // Store as flat DB rows
  const rows = (options.initialData ?? mockBudgetPlans).flatMap(planToRows);

  // RPC: set_budget_amount (upsert)
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/set_budget_amount',
    async (route, request) => {
      const { p_category_id, p_year, p_month, p_amount } = request.postDataJSON();
      const existing = rows.find(
        (r) => r.CategoryId === p_category_id && r.Year === p_year && r.Month === p_month
      );
      if (existing) {
        existing.Amount = p_amount;
      } else {
        rows.push({ CategoryId: p_category_id, Year: p_year, Month: p_month, Amount: p_amount, UserId: 'e2e-user-id' });
      }
      // Return { categoryId, year, months: { "1": 500, ... } } matching function output
      const monthsForCategory = rows.filter((r) => r.CategoryId === p_category_id && r.Year === p_year);
      const months: Record<string, number> = {};
      monthsForCategory.forEach((r) => { months[String(r.Month)] = r.Amount; });
      await route.fulfill({ json: { categoryId: p_category_id, year: p_year, months } });
    }
  );

  // Table: BudgetPlans (GET)
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/BudgetPlans',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const method = request.method();

      if (method === 'GET') {
        const yearParam = getEqParam(reqUrl, 'Year');
        const categoryId = getEqParam(reqUrl, 'CategoryId');
        let filtered = [...rows];
        if (yearParam) filtered = filtered.filter((r) => r.Year === Number(yearParam));
        if (categoryId) filtered = filtered.filter((r) => r.CategoryId === categoryId);
        await route.fulfill({ json: filtered });
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...rows] };
}
