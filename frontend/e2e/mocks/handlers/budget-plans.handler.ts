import { Page } from '@playwright/test';
import type { BudgetPlan } from '../../../src/features/budget/types';
import { mockBudgetPlans } from '../data/budget-plans';

export interface BudgetPlansMockOptions {
  initialData?: BudgetPlan[];
}

export async function setupBudgetPlansMock(page: Page, options: BudgetPlansMockOptions = {}) {
  const store = [...(options.initialData ?? mockBudgetPlans)];

  await page.route(
    (url) => url.pathname === '/api/budget-plans',
    async (route, request) => {
      if (request.method() === 'GET') {
        const reqUrl = new URL(request.url());
        const year = reqUrl.searchParams.get('year');
        const filtered = year ? store.filter((p) => p.year === Number(year)) : [...store];
        await route.fulfill({ json: filtered });
      } else if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        const { categoryId, year, month, amount } = body;
        const existing = store.find((p) => p.categoryId === categoryId && p.year === year);
        if (existing) {
          existing.months[month] = amount;
          await route.fulfill({ json: existing });
        } else {
          const newPlan: BudgetPlan = { categoryId, year, months: { [month]: amount } };
          store.push(newPlan);
          await route.fulfill({ json: newPlan, status: 201 });
        }
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...store] };
}
