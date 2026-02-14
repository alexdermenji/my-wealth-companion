import { Page } from '@playwright/test';
import type { BudgetCategory } from '../../../src/shared/types/category';
import { mockCategories } from '../data/categories';

let nextCatId = 100;

export interface CategoriesMockOptions {
  initialData?: BudgetCategory[];
  usageMap?: Record<string, { transactionCount: number; budgetPlanCount: number }>;
}

export async function setupCategoriesMock(page: Page, options: CategoriesMockOptions = {}) {
  const store = [...(options.initialData ?? mockCategories)];
  const usageMap = options.usageMap ?? {};

  // /api/categories/:id/usage — MUST be registered first
  await page.route(
    (url) => /^\/api\/categories\/[^/]+\/usage$/.test(url.pathname),
    async (route, request) => {
      const parts = new URL(request.url()).pathname.split('/');
      const id = parts[parts.length - 2];
      const usage = usageMap[id] ?? { transactionCount: 0, budgetPlanCount: 0 };
      await route.fulfill({ json: usage });
    }
  );

  // /api/categories/:id (PUT, DELETE)
  await page.route(
    (url) => url.pathname.startsWith('/api/categories/') && !url.pathname.endsWith('/usage'),
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const id = reqUrl.pathname.split('/').pop()!;
      const force = reqUrl.searchParams.get('force') === 'true';

      if (request.method() === 'DELETE') {
        const hasUsage = usageMap[id] && (usageMap[id].transactionCount > 0 || usageMap[id].budgetPlanCount > 0);
        if (!force && hasUsage) {
          await route.fulfill({ status: 409, json: { message: 'Category has dependencies' } });
        } else {
          const idx = store.findIndex((c) => c.id === id);
          if (idx >= 0) store.splice(idx, 1);
          await route.fulfill({ status: 204, body: '' });
        }
      } else if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        const idx = store.findIndex((c) => c.id === id);
        if (idx >= 0) {
          store[idx] = { ...store[idx], ...body };
          await route.fulfill({ json: store[idx] });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else {
        await route.fallback();
      }
    }
  );

  // /api/categories (GET, POST)
  await page.route(
    (url) => url.pathname === '/api/categories',
    async (route, request) => {
      if (request.method() === 'GET') {
        const type = new URL(request.url()).searchParams.get('type');
        const filtered = type ? store.filter((c) => c.type === type) : [...store];
        await route.fulfill({ json: filtered });
      } else if (request.method() === 'POST') {
        const body = request.postDataJSON();
        const newCat = { id: `cat-${nextCatId++}`, ...body };
        store.push(newCat);
        await route.fulfill({ json: newCat, status: 201 });
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...store] };
}
