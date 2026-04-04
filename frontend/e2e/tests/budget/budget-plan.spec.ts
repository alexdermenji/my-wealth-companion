import { test, expect } from '../../fixtures/base.fixture';

test.describe('Budget Plan', () => {
  test('should display heading and year selector', async ({ budgetPlanPage }) => {
    await expect(budgetPlanPage.heading).toBeVisible();
    // Year nav uses arrow buttons, not a combobox
    const yearLabel = budgetPlanPage.page.locator('span.font-bold').filter({ hasText: /^\d{4}$/ });
    await expect(yearLabel).toBeVisible();
  });

  test('should display Remaining row', async ({ budgetPlanPage }) => {
    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toBeVisible();
    // Jan: Income(5000) - Expenses(2000) - Savings(500) - Debt(300) = 2200
    await expect(row).toContainText('2,200.00');
  });

  test('should display 4 budget sections', async ({ budgetPlanPage }) => {
    await expect(budgetPlanPage.page.getByText('Income', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Expenses', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Savings', { exact: true }).first()).toBeVisible();
    // Debt is displayed as Liabilities
    await expect(budgetPlanPage.page.getByText('Liabilities', { exact: true }).first()).toBeVisible();
  });

  test('should display category amounts', async ({ budgetPlanPage }) => {
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    // Cell shows formatted value as span text
    await expect(row).toContainText('4,000.00');
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
    await expect(totalRow).toContainText('5,000.00');
  });

  test('should switch year', async ({ budgetPlanPage }) => {
    await budgetPlanPage.selectYear('2025');
    // With no data for 2025, cells should show '-'
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    await expect(row).toContainText('-');
  });
});

test.describe('Budget Plan - Allocation indicators', () => {
  test.use({
    mockOptions: {
      budgetPlans: { initialData: [] },
    },
  });

  test('shows "—" when there are no values', async ({ budgetPlanPage }) => {
    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toContainText('—');
  });

  test('shows allocation value when totals do not match', async ({ budgetPlanPage }) => {
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '1000');

    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toContainText('£1,000.00');
  });

  test('shows zero remaining when income equals outflow', async ({ budgetPlanPage }) => {
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '1000');
    await budgetPlanPage.setCategoryAmount('Rent', 0, '600');
    await budgetPlanPage.setCategoryAmount('Emergency Fund', 0, '300');
    await budgetPlanPage.setCategoryAmount('Credit Card Debt', 0, '100');

    const row = budgetPlanPage.getRemainingRow();
    // 1000 - 600 - 300 - 100 = 0, shows '—'
    await expect(row).toContainText('—');
  });
});
