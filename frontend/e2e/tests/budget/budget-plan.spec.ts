import { test, expect } from '../../fixtures/base.fixture';

test.describe('Budget Plan', () => {
  test('should display heading and year selector', async ({ budgetPlanPage }) => {
    await expect(budgetPlanPage.heading).toBeVisible();
    const yearTrigger = budgetPlanPage.page.locator('button[role="combobox"]').first();
    await expect(yearTrigger).toBeVisible();
  });

  test('should display Remaining row', async ({ budgetPlanPage }) => {
    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toBeVisible();
    // Jan: Income(5000) - Expenses(2000) - Savings(500) - Debt(300) = 2200
    await expect(row).toContainText('2,200');
  });

  test('should display 4 budget sections', async ({ budgetPlanPage }) => {
    await expect(budgetPlanPage.page.getByText('Income', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Expenses', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Savings', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Debt', { exact: true }).first()).toBeVisible();
  });

  test('should display category amounts', async ({ budgetPlanPage }) => {
    const value = await budgetPlanPage.getCategoryInput('Employment (Net)', 0);
    expect(value).toBe('4000');
  });

  test('should edit a budget cell', async ({ budgetPlanPage }) => {
    let putCalled = false;
    await budgetPlanPage.page.route(
      (url) => url.pathname === '/api/budget-plans',
      async (route, request) => {
        if (request.method() === 'PUT') {
          putCalled = true;
        }
        await route.fallback();
      }
    );

    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '5000');
    // Wait a moment for the PUT to fire
    await budgetPlanPage.page.waitForTimeout(500);
    expect(putCalled).toBe(true);
  });

  test('should show success toast after editing a budget cell', async ({ budgetPlanPage }) => {
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '5000');
    const toast = budgetPlanPage.page.locator('[data-sonner-toast]', { hasText: 'Budget updated' });
    await expect(toast).toBeVisible();
  });

  test('should display section totals', async ({ budgetPlanPage }) => {
    // Income total for Jan = 4000 + 1000 = 5000
    const totalRow = budgetPlanPage.page.locator('tr').filter({ hasText: /Total/ }).first();
    await expect(totalRow).toContainText('5,000');
  });

  test('should display yearly totals', async ({ budgetPlanPage }) => {
    // Employment (Net) yearly = 4000 + 4000 + 4000 = 12000
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    await expect(row).toContainText('12,000');
  });

  test('should switch year', async ({ budgetPlanPage }) => {
    await budgetPlanPage.selectYear('2025');
    // With no data for 2025, inputs should be empty/zero
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    const firstInput = row.locator('input[type="number"]').first();
    const value = await firstInput.inputValue();
    expect(value === '' || value === '0').toBeTruthy();
  });
});
