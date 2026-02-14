import { Page } from '@playwright/test';
import type { Account } from '../../../src/shared/types/account';
import { mockAccounts } from '../data/accounts';

let nextAccId = 100;

export async function setupAccountsMock(page: Page, data: Account[] = mockAccounts) {
  const store = [...data];

  await page.route(
    (url) => url.pathname.startsWith('/api/accounts/'),
    async (route, request) => {
      const id = new URL(request.url()).pathname.split('/').pop()!;

      if (request.method() === 'DELETE') {
        const idx = store.findIndex((a) => a.id === id);
        if (idx >= 0) store.splice(idx, 1);
        await route.fulfill({ status: 204, body: '' });
      } else if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        const idx = store.findIndex((a) => a.id === id);
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

  await page.route(
    (url) => url.pathname === '/api/accounts',
    async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({ json: [...store] });
      } else if (request.method() === 'POST') {
        const body = request.postDataJSON();
        const newAcc = { id: `acc-${nextAccId++}`, ...body };
        store.push(newAcc);
        await route.fulfill({ json: newAcc, status: 201 });
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...store] };
}
