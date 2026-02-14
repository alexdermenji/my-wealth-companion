import { Page } from '@playwright/test';
import type { Transaction } from '../../../src/features/transactions/types';
import { mockTransactions, createMockTransaction } from '../data/transactions';

export interface TransactionsMockOptions {
  initialData?: Transaction[];
}

export async function setupTransactionsMock(page: Page, options: TransactionsMockOptions = {}) {
  const store = [...(options.initialData ?? mockTransactions)];

  // Handle /api/transactions/:id (PUT, DELETE)
  await page.route(
    (url) => url.pathname.startsWith('/api/transactions/'),
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const id = reqUrl.pathname.split('/').pop()!;

      if (request.method() === 'DELETE') {
        const idx = store.findIndex((t) => t.id === id);
        if (idx >= 0) store.splice(idx, 1);
        await route.fulfill({ status: 204, body: '' });
      } else if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        const idx = store.findIndex((t) => t.id === id);
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

  // Handle /api/transactions (GET, POST)
  await page.route(
    (url) => url.pathname === '/api/transactions',
    async (route, request) => {
      if (request.method() === 'GET') {
        const reqUrl = new URL(request.url());
        const budgetType = reqUrl.searchParams.get('budgetType');
        const accountId = reqUrl.searchParams.get('accountId');

        let filtered = [...store];
        if (budgetType) filtered = filtered.filter((t) => t.budgetType === budgetType);
        if (accountId) filtered = filtered.filter((t) => t.accountId === accountId);

        await route.fulfill({ json: filtered });
      } else if (request.method() === 'POST') {
        const body = request.postDataJSON();
        const newTx = createMockTransaction(body);
        store.push(newTx);
        await route.fulfill({ json: newTx, status: 201 });
      } else {
        await route.fallback();
      }
    }
  );

  return {
    getStore: () => [...store],
  };
}
