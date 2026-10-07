import { test, expect } from '../../fixtures/base.fixture';

test.setTimeout(60_000);
for (const mobile of [false, true]) {
  test(`${mobile ? 'mobile' : 'desktop'}: hide assets and restore paid debts without losing history`, async ({ page, mockSetup }) => {
    await page.clock.setFixedTime(new Date('2026-04-15T12:00:00Z'));
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/net-worth');
    const values = mockSetup.netWorthMock.getValues();
    const actions = (name: string) => page.getByRole('button', { name: `Open actions for ${name}`, exact: true });
    const total = mobile ? page.getByText('$55,250', { exact: true }) : page.getByRole('row').filter({ hasText: 'Total Assets' });
    await expect(total).toBeVisible();
    const before = await total.textContent();
    await actions('Cash Savings').click();
    await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
    await expect(actions('Cash Savings')).toHaveCount(0);
    const hiddenAssets = page.getByRole('button', { name: 'Assets: Hidden (1)', exact: true });
    await expect(hiddenAssets).toBeFocused();
    expect(await total.textContent()).toBe(before);
    expect(mockSetup.netWorthMock.getValues()).toEqual(values);
    await page.reload();
    await hiddenAssets.click();
    await page.getByRole('button', { name: 'Restore Cash Savings (Cash)', exact: true }).click();
    await expect(actions('Cash Savings')).toBeFocused();
    if (mobile) await page.getByRole('button', { name: 'Liabilities', exact: true }).click();
    await actions('Mortgage').click();
    await page.getByRole('menuitem', { name: 'Mark as paid off', exact: true }).click();
    await expect(actions('Mortgage')).toHaveCount(0);
    const hiddenDebt = page.getByRole('button', { name: 'Liabilities: Hidden (1)', exact: true });
    await expect(hiddenDebt).toHaveAttribute('aria-expanded', 'false');
    await page.reload();
    if (mobile) await page.getByRole('button', { name: 'Liabilities', exact: true }).click();
    await hiddenDebt.click();
    await page.getByRole('button', { name: 'Restore Mortgage (Home)', exact: true }).click();
    await expect(actions('Mortgage')).toBeVisible();
    await page.reload();
    if (mobile) await page.getByRole('button', { name: 'Liabilities', exact: true }).click();
    await expect(actions('Mortgage')).toBeVisible();
    expect(mockSetup.netWorthMock.getValues().filter(v => v.ItemId === 'nw3' && v.Month < 4)).toEqual(values.filter(v => v.ItemId === 'nw3' && v.Month < 4));
    const row = mobile ? page.locator('div.flex.items-center.justify-between').filter({ has: actions('Mortgage') }).last() : page.getByRole('row').filter({ has: actions('Mortgage') });
    const input = row.getByRole('textbox').nth(mobile ? 0 : 3);
    await input.fill('1000');
    await input.press('Enter');
    await expect.poll(() => mockSetup.netWorthMock.getValues().find(v => v.ItemId === 'nw3' && v.Month === 4)?.Amount).toBe(1000);
    await expect(actions('Mortgage')).toBeVisible();
  });
}

test('failed visibility writes keep the item in place and allow retry', async ({ page, mockSetup }) => {
  expect(mockSetup.netWorthMock.getItems()).toHaveLength(3);
  await page.goto('/net-worth');
  let fail = true;
  await page.route('**/rest/v1/NetWorthItems?*', async (route, request) => {
    if (request.method() === 'PATCH' && fail) await route.fulfill({ status: 500, json: { message: 'offline' } });
    else await route.fallback();
  });
  const actions = page.getByRole('button', { name: 'Open actions for Cash Savings' });
  await actions.click();
  await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await expect(page.getByText('Failed to change item visibility')).toBeVisible();
  await expect(actions).toBeVisible();
  fail = false;
  await actions.click();
  await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await page.getByRole('button', { name: 'Assets: Hidden (1)' }).click();
  fail = true;
  const restore = page.getByRole('button', { name: 'Restore Cash Savings (Cash)' });
  await restore.click();
  await expect(restore).toBeEnabled();
  await expect(actions).toHaveCount(0);
  fail = false;
  await restore.click();
  await expect(actions).toBeVisible();
});
