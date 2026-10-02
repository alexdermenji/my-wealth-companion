import { test, expect } from '../../fixtures/base.fixture';

// These flows include multiple saves, reloads and year changes.
test.setTimeout(60_000);

test('desktop Hide persists across reload and years, keeps totals, and restores with focus', async ({ budgetPlanPage, mockSetup }) => {
  const { page } = budgetPlanPage;
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  await budgetPlanPage.goto();
  await budgetPlanPage.switchToEditTab();
  const total = await budgetPlanPage.getSectionTotalRow('Expenses').textContent();
  const remaining = await budgetPlanPage.getRemainingRow().textContent();
  await page.getByRole('button', { name: 'Actions for Rent', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Actions for Rent', exact: true })).toHaveCount(0);
  const hidden = page.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true });
  await expect(hidden).toBeFocused();
  await expect(hidden).toHaveAttribute('aria-expanded', 'false');
  expect(await budgetPlanPage.getSectionTotalRow('Expenses').textContent()).toBe(total);
  expect(await budgetPlanPage.getRemainingRow().textContent()).toBe(remaining);
  expect(mockSetup.categoriesMock.getStore().find(c => c.Id === 'c3')?.IsHiddenInBudget).toBe(true);
  await page.reload();
  await budgetPlanPage.switchToEditTab();
  await expect(hidden).toBeVisible();
  await budgetPlanPage.selectYear('2027');
  await expect(hidden).toBeVisible();
  await hidden.click();
  await page.getByRole('button', { name: 'Restore Rent (Housing)', exact: true }).click();
  await expect(hidden).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Actions for Rent', exact: true })).toBeFocused();
  await budgetPlanPage.selectYear('2026');
  await expect(budgetPlanPage.getCellInput('Rent', 0)).toHaveValue('1,200.00');
});

test('failed hide and restore retain their lists and allow retry', async ({ budgetPlanPage }) => {
  const { page } = budgetPlanPage;
  await budgetPlanPage.switchToEditTab();
  let fail = true;
  await page.route('**/rest/v1/Categories?*', async (route, request) => {
    if (request.method() === 'PATCH' && fail) await route.fulfill({ status: 500, json: { message: 'offline' } });
    else await route.fallback();
  });
  const action = page.getByRole('button', { name: 'Actions for Rent', exact: true });
  await action.click();
  await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await expect(page.getByText("Couldn't hide category. Please try again.", { exact: true })).toBeVisible();
  await expect(action).toBeVisible();
  await expect(page.getByRole('button', { name: /Expenses: Hidden/ })).toHaveCount(0);
  fail = false;
  await action.click();
  await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  await page.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true }).click();
  const restore = page.getByRole('button', { name: 'Restore Rent (Housing)', exact: true });
  fail = true;
  await restore.click();
  await expect(page.getByText("Couldn't restore category. Please try again.", { exact: true })).toBeVisible();
  await expect(restore).toBeVisible();
  await expect(action).toHaveCount(0);
  fail = false;
  await restore.click();
  await expect(action).toBeVisible();
});

test('restores into the active amount sort and supports hiding all rows', async ({ budgetPlanPage }) => {
  const { page } = budgetPlanPage;
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  await budgetPlanPage.goto();
  await budgetPlanPage.switchToEditTab();
  const sort = page.getByRole('button', { name: /^Expenses, Jan:/ });
  await sort.click();
  await sort.click();
  for (const name of ['Rent', 'Groceries']) {
    await page.getByRole('button', { name: `Actions for ${name}`, exact: true }).click();
    await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
    await expect(page.getByRole('button', { name: `Actions for ${name}`, exact: true })).toHaveCount(0);
  }
  const hidden = page.getByRole('button', { name: 'Expenses: Hidden (2)', exact: true });
  await hidden.click();
  await page.getByRole('button', { name: 'Restore Rent (Housing)', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Restore Groceries (Groceries)', exact: true }).click();
  const rows = page.locator('tr[draggable]').filter({ hasText: /Rent|Groceries/ });
  await expect(rows.first()).toContainText('Groceries');
  await expect(sort).toHaveAccessibleName(/Lowest to highest/);
  await sort.click();
  await expect(rows.first()).toContainText('Rent');
});

test.describe('hidden rows and manual ordering', () => {
  test.use({ mockOptions: { categories: { initialData: [
    { id: 'a', name: 'Alpha', type: 'Expenses', group: 'Bills', order: 0 },
    { id: 'b', name: 'Beta', type: 'Expenses', group: 'Bills', order: 1 },
    { id: 'c', name: 'Gamma', type: 'Expenses', group: 'Bills', order: 2 },
    { id: 'd', name: 'Delta', type: 'Expenses', group: 'Bills', order: 3 },
  ] } } });

  test('drag uses the full list position, retains hidden rows and survives reload', async ({ budgetPlanPage, mockSetup }) => {
    const { page } = budgetPlanPage;
    await budgetPlanPage.switchToEditTab();
    for (const name of ['Alpha', 'Gamma']) {
      await page.getByRole('button', { name: `Actions for ${name}`, exact: true }).click();
      await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
      await expect(page.getByRole('button', { name: `Actions for ${name}`, exact: true })).toHaveCount(0);
    }
    const row = (name: string) => page.locator('tr[draggable]').filter({ has: page.getByRole('button', { name: `Actions for ${name}`, exact: true }) });
    await row('Delta').dragTo(row('Beta'), { targetPosition: { x: 20, y: 2 } });
    await expect.poll(() => mockSetup.categoriesMock.getStore().filter(c => c.Type === 'Expenses').sort((a,b) => a.Order-b.Order).map(c => c.Name)).toEqual(['Alpha', 'Delta', 'Beta', 'Gamma']);
    await page.reload();
    await budgetPlanPage.switchToEditTab();
    await page.getByRole('button', { name: 'Expenses: Hidden (2)', exact: true }).click();
    for (const name of ['Alpha', 'Gamma']) {
      await page.getByRole('button', { name: `Restore ${name} (Bills)`, exact: true }).click();
      await expect(page.getByRole('button', { name: `Actions for ${name}`, exact: true })).toBeVisible();
    }
    await expect(page.locator('tr[draggable]').first()).toContainText('Alpha');
    await expect(page.locator('tr[draggable]').nth(1)).toContainText('Delta');
    await expect(page.locator('tr[draggable]').nth(2)).toContainText('Beta');
    await expect(page.locator('tr[draggable]').nth(3)).toContainText('Gamma');
  });

  test('rejected reorder returns to saved order without losing hidden rows', async ({ budgetPlanPage }) => {
    const { page } = budgetPlanPage;
    await budgetPlanPage.switchToEditTab();
    await page.getByRole('button', { name: 'Actions for Alpha', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true })).toBeVisible();
    await page.route('**/rest/v1/rpc/reorder_category', route => route.fulfill({ status: 500, json: { message: 'offline' } }));
    const rows = page.locator('tr[draggable]');
    await rows.last().dragTo(rows.first(), { targetPosition: { x: 20, y: 2 } });
    await expect(page.getByText("Couldn't reorder categories. Please try again.", { exact: true })).toBeVisible();
    await expect(rows.first()).toContainText('Beta');
    await expect(page.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true })).toBeVisible();
  });
});

test('mobile Hide and Restore retain totals, survive navigation and share state with a second client', async ({ budgetPlanPage, mockSetup }) => {
  const { page } = budgetPlanPage;
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  await page.setViewportSize({ width: 390, height: 844 });
  await budgetPlanPage.goto();
  await budgetPlanPage.editBudgetTab.click();
  await page.getByRole('button', { name: 'Expenses', exact: true }).click();
  const sort = page.getByRole('button', { name: /^Expenses, Jan:/ });
  await sort.click();
  await sort.click();
  await page.getByRole('button', { name: 'Actions for Groceries', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
  const hidden = page.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true });
  await expect(hidden).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveCount(1);
  await expect(page.getByText('$2,000', { exact: true })).toBeVisible();
  await expect(page.getByText('$2,200.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(hidden).toBeVisible();
  await page.getByRole('button', { name: 'Income', exact: true }).click();
  await expect(page.getByRole('button', { name: /Hidden \(/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Expenses', exact: true }).click();
  await expect(hidden).toHaveAttribute('aria-expanded', 'false');
  await page.reload();
  await budgetPlanPage.editBudgetTab.click();
  await page.getByRole('button', { name: 'Expenses', exact: true }).click();
  await expect(hidden).toBeVisible();

  // Separate browser context, shared mock backend storage: no shared React cache or local storage.
  const context = await page.context().browser()!.newContext({ baseURL: 'http://localhost:8081' });
  try {
    const second = await context.newPage();
    await second.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
    const { setupAllMocks } = await import('../../mocks/handlers');
    await setupAllMocks(second, { categories: { sharedStore: mockSetup.categoriesMock.sharedStore } });
    await second.goto('/budget');
    await second.getByRole('tab', { name: 'Edit Budget', exact: true }).click();
    await second.getByRole('button', { name: 'Expenses: Hidden (1)', exact: true }).click();
    await second.getByRole('button', { name: 'Restore Groceries (Groceries)', exact: true }).click();
    await expect(second.getByRole('button', { name: 'Actions for Groceries', exact: true })).toBeVisible();
    await page.reload();
    await budgetPlanPage.editBudgetTab.click();
    await page.getByRole('button', { name: 'Expenses', exact: true }).click();
    await expect(hidden).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Actions for Groceries', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Actions for Rent', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
    await hidden.click();
    await page.getByRole('button', { name: 'Restore Rent (Housing)', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Actions for Rent', exact: true })).toBeFocused();
    await expect(page.getByRole('textbox')).toHaveCount(2);
  } finally {
    await context.close();
  }
});
