import { Page } from '@playwright/test';
import type { Account } from '../../../src/shared/types/account';
import { mockAccounts } from '../data/accounts';

let nextAccId = 100;

// Convert frontend camelCase type to DB PascalCase row (what supabase-js returns)
function toRow(a: Account) {
  return { Id: a.id, Name: a.name, Type: a.type, OpeningBalance: a.openingBalance, UserId: 'e2e-user-id' };
}

function getEqParam(url: URL, col: string): string | null {
  const val = url.searchParams.get(col);
  return val?.startsWith('eq.') ? val.slice(3) : null;
}

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

export async function setupAccountsMock(page: Page, data: Account[] = mockAccounts) {
  const store = data.map(toRow);

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/Accounts',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const method = request.method();

      if (method === 'GET') {
        await route.fulfill({ json: [...store] });
      } else if (method === 'POST') {
        const body = request.postDataJSON();
        const newRow = { Id: `acc-${nextAccId++}`, UserId: 'e2e-user-id', ...body };
        store.push(newRow);
        await route.fulfill({ json: newRow, status: 201 });
      } else if (method === 'PATCH') {
        const id = getEqParam(reqUrl, 'Id');
        const body = request.postDataJSON();
        const idx = store.findIndex((a) => a.Id === id);
        if (idx >= 0) {
          store[idx] = { ...store[idx], ...body };
          await route.fulfill({ json: store[idx] });
        } else {
          await route.fulfill({ status: 404, json: { message: 'Not found' } });
        }
      } else if (method === 'DELETE') {
        const id = getEqParam(reqUrl, 'Id');
        const idx = store.findIndex((a) => a.Id === id);
        if (idx >= 0) store.splice(idx, 1);
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...store] };
}
