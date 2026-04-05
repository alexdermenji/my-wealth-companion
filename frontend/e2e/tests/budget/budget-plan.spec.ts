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
    await expect(row).toContainText('$2,200.00');
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
    // Cell shows formatted value in the input's value attribute
    const firstInput = row.locator('input[type="text"]').first();
    await expect(firstInput).toHaveValue('4,000.00');
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
    // Income total for Jan = 4000 + 1000 = 5000 → rendered as $5,000
    const totalRow = budgetPlanPage.page.locator('tr').filter({ hasText: /Total/ }).first();
    await expect(totalRow).toContainText('$5,000');
  });

  test('should switch year', async ({ budgetPlanPage }) => {
    await budgetPlanPage.selectYear('2025');
    // With no data for 2025, cells should be empty
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    const firstInput = row.locator('input[type="text"]').first();
    await expect(firstInput).toHaveValue('');
  });
});

test.describe('Budget Plan - Shift+Tab fill', () => {
  test.use({
    mockOptions: {
      budgetPlans: { initialData: [] },
    },
  });

  test('fills next empty month and moves focus there', async ({ budgetPlanPage }) => {
    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 0, '3000');

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toHaveValue('3,000.00');
    await expect(feb).toBeFocused();
  });

  test('chains fill across months with repeated Shift+Tab', async ({ budgetPlanPage }) => {
    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 0, '2000');

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toBeFocused();

    // Press Shift+Tab while focus is on Feb — should fill Mar
    await budgetPlanPage.page.keyboard.press('Shift+Tab');

    const mar = budgetPlanPage.getCellInput('Employment (Net)', 2);
    await expect(mar).toHaveValue('2,000.00');
    await expect(mar).toBeFocused();

    // Feb should also carry the same value
    await expect(feb).toHaveValue('2,000.00');
  });

  test('does not overwrite a month that already has a value', async ({ budgetPlanPage }) => {
    // Seed Jan = 3000 and Feb = 1500
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '3000');
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 1, '1500');

    // Shift+Tab from Jan — Feb already has 1500, should not be overwritten
    await budgetPlanPage.shiftTabCell('Employment (Net)', 0);

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toHaveValue('1,500.00');
    await expect(feb).toBeFocused();
  });

  test('regular Tab does not fill the next month', async ({ budgetPlanPage }) => {
    // setCategoryAmount commits via regular Tab — Feb should remain empty
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '2000');

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toHaveValue('');
  });

  test('fires a PUT request for the filled month', async ({ budgetPlanPage }) => {
    const puts: Array<{ categoryId: string; month: number; amount: number }> = [];
    await budgetPlanPage.page.route(
      (url) => url.pathname === '/api/budget-plans',
      async (route, request) => {
        if (request.method() === 'PUT') puts.push(request.postDataJSON());
        await route.fallback();
      },
    );

    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 0, '1500');
    await budgetPlanPage.page.waitForTimeout(400);

    const febPut = puts.find(r => r.month === 2);
    expect(febPut).toBeDefined();
    expect(febPut?.amount).toBe(1500);
  });

  test('Shift+Tab from December does not fill a non-existent month', async ({ budgetPlanPage }) => {
    // Month index 11 = December (the last column)
    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 11, '1000');

    // Dec should be committed with the typed value
    const dec = budgetPlanPage.getCellInput('Employment (Net)', 11);
    await expect(dec).toHaveValue('1,000.00');

    // No "month 13" input should exist
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    await expect(row.locator('input[type="text"]')).toHaveCount(12);
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
    await expect(row).toContainText('$1,000.00');
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
