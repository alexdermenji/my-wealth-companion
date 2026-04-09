import { Page } from '@playwright/test';
import { mockSettings } from '../data/settings';

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

export async function setupSettingsMock(page: Page) {
  // DB PascalCase format
  const store = {
    StartYear: mockSettings.startYear,
    StartMonth: mockSettings.startMonth,
    Currency: mockSettings.currency,
    UserId: 'e2e-user-id',
  };

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/Settings',
    async (route, request) => {
      const method = request.method();

      if (method === 'GET') {
        await route.fulfill({ json: { ...store } });
      } else if (method === 'PATCH') {
        const body = request.postDataJSON();
        Object.assign(store, body);
        await route.fulfill({ json: { ...store } });
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => ({ ...store }) };
}
