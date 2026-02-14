import { Page } from '@playwright/test';
import { mockSettings } from '../data/settings';

export async function setupSettingsMock(page: Page) {
  const store = { ...mockSettings };

  await page.route(
    (url) => url.pathname === '/api/settings',
    async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({ json: { ...store } });
      } else if (request.method() === 'PUT') {
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
