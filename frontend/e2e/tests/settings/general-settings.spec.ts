import { test, expect } from '../../fixtures/base.fixture';

test.describe('General Settings', () => {
  test('should display current values', async ({ settingsPage }) => {
    await expect(settingsPage.getGeneralInput('Start Year')).toHaveValue('2026');
    await expect(settingsPage.getGeneralInput('Start Month')).toHaveValue('1');
    await expect(settingsPage.getGeneralInput('Currency')).toHaveValue('$');
  });

  test('should update currency', async ({ settingsPage }) => {
    let putBody: Record<string, unknown> | null = null;
    await settingsPage.page.route(
      (url) => url.pathname === '/api/settings',
      async (route, request) => {
        if (request.method() === 'PUT') {
          putBody = request.postDataJSON();
        }
        await route.fallback();
      }
    );

    await settingsPage.setGeneralValue('Currency', '€');
    await settingsPage.page.waitForTimeout(500);
    expect(putBody).toBeTruthy();
    expect((putBody as Record<string, unknown>).currency).toBe('€');
  });

  test('should show success toast after saving', async ({ settingsPage }) => {
    await settingsPage.setGeneralValue('Currency', '€');
    const toast = settingsPage.page.locator('[data-sonner-toast]', { hasText: 'Settings saved' });
    await expect(toast).toBeVisible();
  });

  test('should update start year', async ({ settingsPage }) => {
    await settingsPage.setGeneralValue('Start Year', '2025');
    await expect(settingsPage.getGeneralInput('Start Year')).toHaveValue('2025');
  });

  test('should update start month', async ({ settingsPage }) => {
    await settingsPage.setGeneralValue('Start Month', '6');
    await expect(settingsPage.getGeneralInput('Start Month')).toHaveValue('6');
  });
});
