import { test, expect } from '../../fixtures/base.fixture';
import { mockCategories } from '../../mocks/data/categories';

test.use({ mockOptions: {
  categories: { initialData: mockCategories.map(c => ({ ...c, isHiddenInBudget: c.id === 'c6' })) },
  budgetPlans: { initialData: [
    { categoryId: 'c1', year: 2026, months: { 12: 3000 } },
    { categoryId: 'c3', year: 2026, months: { 12: 1200 } },
    { categoryId: 'c3', year: 2027, months: { 1: 0, 2: 1400 } },
    { categoryId: 'c5', year: 2026, months: { 12: 0 } },
    { categoryId: 'c6', year: 2026, months: { 12: 500 } },
  ] },
} });

test.beforeEach(async ({ page, mockSetup }) => {
  void mockSetup;
  await page.clock.setFixedTime(new Date('2027-02-15T12:00:00Z'));
});

test('confirmation copies December into empty January cells, keeps zero and skips hidden categories', async ({ budgetPlanPage, mockSetup }) => {
  const { page } = budgetPlanPage;
  await budgetPlanPage.switchToEditTab();
  const open = page.getByRole('button', { name: 'Copy December to January' });
  await open.click();
  await expect(page.getByRole('alertdialog')).toContainText('Fill January 2027?');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(mockSetup.budgetPlansMock.getStore()).toHaveLength(6);
  await open.click();
  await page.getByRole('button', { name: 'Copy amounts', exact: true }).click();
  await expect(page.getByText('Copied 2 amounts to January 2027', { exact: true })).toBeVisible();
  await expect(budgetPlanPage.getCellInput('Employment (Net)', 0)).toHaveValue('3,000.00');
  await expect(budgetPlanPage.getCategoryRow('Employment (Net)').locator('td').last()).toContainText('3,000');
  const rows = mockSetup.budgetPlansMock.getStore();
  expect(rows.filter(r => r.Year === 2027 && r.Month === 1).map(r => [r.CategoryId, r.Amount])).toEqual([['c3', 0], ['c1', 3000], ['c5', 0]]);
  expect(rows.find(r => r.Year === 2027 && r.Month === 2)?.Amount).toBe(1400);
  expect(rows.filter(r => r.Year === 2026)).toHaveLength(4);
  await open.click();
  await page.getByRole('button', { name: 'Copy amounts', exact: true }).click();
  await expect(page.getByText('January 2027 already has these amounts. Nothing changed.', { exact: true })).toBeVisible();
  expect(mockSetup.budgetPlansMock.getStore()).toHaveLength(8);
});

test('failed request can be retried and empty source year gives feedback', async ({ budgetPlanPage }) => {
  const { page } = budgetPlanPage;
  await budgetPlanPage.switchToEditTab();
  let fail = true;
  await page.route('**/rest/v1/rpc/copy_budget_to_january', route => fail
    ? route.fulfill({ status: 500, json: { message: 'offline' } }) : route.fallback());
  await page.getByRole('button', { name: 'Copy December to January' }).click();
  await page.getByRole('button', { name: 'Copy amounts', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Couldn’t copy the budget. Please try again.');
  fail = false;
  await page.getByRole('button', { name: 'Copy amounts', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await budgetPlanPage.selectYear('2029');
  await page.getByRole('button', { name: 'Copy December to January' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('December 2028');
  await page.getByRole('button', { name: 'Copy amounts', exact: true }).click();
  await expect(page.getByText('No visible December 2028 amounts to copy', { exact: true })).toBeVisible();
});

test('mobile opens January after copying', async ({ budgetPlanPage }) => {
  const { page } = budgetPlanPage;
  await page.setViewportSize({ width: 390, height: 844 });
  await budgetPlanPage.editBudgetTab.click();
  await page.getByRole('button', { name: 'Copy December to January' }).click();
  await page.getByRole('button', { name: 'Copy amounts', exact: true }).click();
  await expect(page.getByText('Copied 2 amounts to January 2027', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox').first()).toHaveValue('3,000.00');
});
