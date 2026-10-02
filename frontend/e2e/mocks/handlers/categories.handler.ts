import { Page } from '@playwright/test';
import type { BudgetCategory } from '../../../src/shared/types/category';
import { mockCategories } from '../data/categories';

let nextCatId = 100;

function toRow(c: BudgetCategory) {
  return { Id: c.id, Name: c.name, Type: c.type, Group: c.group, Order: c.order, IsHiddenInBudget: c.isHiddenInBudget ?? false, UserId: 'e2e-user-id' };
}

function getEqParam(url: URL, col: string): string | null {
  const val = url.searchParams.get(col);
  return val?.startsWith('eq.') ? val.slice(3) : null;
}

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

export interface CategoriesMockOptions {
  initialData?: BudgetCategory[];
  sharedStore?: ReturnType<typeof toRow>[];
  usageMap?: Record<string, { transactionCount: number; budgetPlanCount: number }>;
}

export async function setupCategoriesMock(page: Page, options: CategoriesMockOptions = {}) {
  const store = options.sharedStore ?? (options.initialData ?? mockCategories).map(toRow);
  const usageMap = options.usageMap ?? {};

  // RPC: get_category_usage
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/get_category_usage',
    async (route, request) => {
      const { p_category_id } = request.postDataJSON();
      const usage = usageMap[p_category_id] ?? { transactionCount: 0, budgetPlanCount: 0 };
      await route.fulfill({ json: usage });
    }
  );

  // RPC: reorder_category
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/reorder_category',
    async (route, request) => {
      const { p_category_id, p_new_order } = request.postDataJSON();
      const item = store.find(c => c.Id === p_category_id);
      if (item) {
        const siblings = store.filter(c => c.Type === item.Type && c.Id !== item.Id).sort((a, b) => a.Order - b.Order);
        siblings.splice(Math.max(0, Math.min(p_new_order, siblings.length)), 0, item);
        siblings.forEach((c, i) => { c.Order = i; });
      }
      await route.fulfill({ status: 204, body: '' });
    }
  );

  // RPC: force_delete_category
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/force_delete_category',
    async (route, request) => {
      const { p_category_id } = request.postDataJSON();
      const idx = store.findIndex((c) => c.Id === p_category_id);
      if (idx >= 0) store.splice(idx, 1);
      await route.fulfill({ status: 204, body: '' });
    }
  );

  // Table: Categories (GET, POST, PATCH, DELETE)
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/Categories',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const method = request.method();

      if (method === 'GET') {
        const typeFilter = getEqParam(reqUrl, 'Type');
        const filtered = (typeFilter ? store.filter((c) => c.Type === typeFilter) : [...store]).sort((a, b) => a.Order - b.Order);
        const limit = reqUrl.searchParams.get('limit');
        const result = limit ? filtered.slice(0, Number(limit)) : filtered;
        await route.fulfill({ json: result });
      } else if (method === 'POST') {
        const body = request.postDataJSON();
        const maxOrder = store.filter((c) => c.Type === body.Type).reduce((m, c) => Math.max(m, c.Order), -1);
        const newRow = { IsHiddenInBudget: false, Id: `cat-${nextCatId++}`, Order: maxOrder + 1, UserId: 'e2e-user-id', ...body };
        store.push(newRow);
        await route.fulfill({ json: newRow, status: 201 });
      } else if (method === 'PATCH') {
        const id = getEqParam(reqUrl, 'Id');
        const body = request.postDataJSON();
        const idx = store.findIndex((c) => c.Id === id);
        if (idx >= 0) {
          store[idx] = { ...store[idx], ...body };
          await route.fulfill({ json: store[idx] });
        } else {
          await route.fulfill({ status: 404, json: { message: 'Not found' } });
        }
      } else if (method === 'DELETE') {
        const id = getEqParam(reqUrl, 'Id');
        const hasUsage = usageMap[id!] &&
          (usageMap[id!].transactionCount > 0 || usageMap[id!].budgetPlanCount > 0);
        if (hasUsage) {
          await route.fulfill({ status: 409, json: { message: 'Category has dependencies' } });
        } else {
          const idx = store.findIndex((c) => c.Id === id);
          if (idx >= 0) store.splice(idx, 1);
          await route.fulfill({ status: 204, body: '' });
        }
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...store], sharedStore: store };
}
