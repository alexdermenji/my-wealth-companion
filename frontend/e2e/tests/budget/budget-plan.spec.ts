import { test, expect } from '../../fixtures/base.fixture';

test.describe('Budget Plan — tab bar', () => {
  test('should show Overview tab as active by default', async ({ budgetPlanPage }) => {
    await expect(budgetPlanPage.overviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(budgetPlanPage.editBudgetTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should display budget type sections in Overview tab', async ({ budgetPlanPage }) => {
    // BudgetBreakdown renders Income/Expenses/Savings/Debt navigator buttons
    await expect(budgetPlanPage.page.getByRole('button', { name: /income/i }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByRole('button', { name: /expenses/i }).first()).toBeVisible();
  });

  test('should show budget grid after switching to Edit Budget tab', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await expect(budgetPlanPage.page.getByText('Allocations', { exact: true })).toBeVisible();
  });
});

test.describe('Budget Plan', () => {
  test('should display heading and date selectors', async ({ budgetPlanPage }) => {
    await expect(budgetPlanPage.heading).toBeVisible();
    // Overview shows Year + Month dropdowns
    const overviewSelects = budgetPlanPage.page.getByRole('combobox');
    await expect(overviewSelects).toHaveCount(2);
    // Edit tab shows Year dropdown only
    await budgetPlanPage.switchToEditTab();
    await expect(budgetPlanPage.page.getByRole('combobox')).toHaveCount(1);
  });

  test('should display Remaining row', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toBeVisible();
    // Jan: Income(5000) - Expenses(2000) - Savings(500) - Debt(300) = 2200
    await expect(row).toContainText('$2,200.00');
  });

  test('should display 4 budget sections', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await expect(budgetPlanPage.page.getByText('Income', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Expenses', { exact: true }).first()).toBeVisible();
    await expect(budgetPlanPage.page.getByText('Savings', { exact: true }).first()).toBeVisible();
    // Debt is displayed as Liabilities
    await expect(budgetPlanPage.page.getByText('Liabilities', { exact: true }).first()).toBeVisible();
  });

  test('should display category amounts', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    const row = budgetPlanPage.getCategoryRow('Employment (Net)');
    const firstInput = row.locator('input[type="text"]').first();
    await expect(firstInput).toHaveValue('4,000.00');
  });

  test('should edit a budget cell', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    let putCalled = false;
    await budgetPlanPage.page.route(
      (url) => url.hostname.includes('supabase.co') && url.pathname === '/rest/v1/rpc/set_budget_amount',
      async (route, request) => {
        if (request.method() === 'POST') {
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
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '5000');
    const toast = budgetPlanPage.page.locator('[data-sonner-toast]', { hasText: 'Budget updated' });
    await expect(toast).toBeVisible();
  });

  test('should display section totals', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    // Income total for Jan = 4000 + 1000 = 5000 → rendered as $5,000
    const totalRow = budgetPlanPage.page.locator('tr').filter({ hasText: /Total/ }).first();
    await expect(totalRow).toContainText('$5,000');
  });

  test('should switch year', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.selectYear('2027');
    // With no data for 2027, cells should be empty
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
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 0, '3000');

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toHaveValue('3,000.00');
    await expect(feb).toBeFocused();
  });

  test('chains fill across months with repeated Shift+Tab', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 0, '2000');

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toBeFocused();

    await budgetPlanPage.page.keyboard.press('Shift+Tab');

    const mar = budgetPlanPage.getCellInput('Employment (Net)', 2);
    await expect(mar).toHaveValue('2,000.00');
    await expect(mar).toBeFocused();

    await expect(feb).toHaveValue('2,000.00');
  });

  test('does not overwrite a month that already has a value', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '3000');
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 1, '1500');

    await budgetPlanPage.shiftTabCell('Employment (Net)', 0);

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toHaveValue('1,500.00');
    await expect(feb).toBeFocused();
  });

  test('regular Tab does not fill the next month', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '2000');

    const feb = budgetPlanPage.getCellInput('Employment (Net)', 1);
    await expect(feb).toHaveValue('');
  });

  test('fires a PUT request for the filled month', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    const puts: Array<{ p_category_id: string; p_month: number; p_amount: number }> = [];
    await budgetPlanPage.page.route(
      (url) => url.hostname.includes('supabase.co') && url.pathname === '/rest/v1/rpc/set_budget_amount',
      async (route, request) => {
        if (request.method() === 'POST') puts.push(request.postDataJSON());
        await route.fallback();
      },
    );

    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 0, '1500');
    await budgetPlanPage.page.waitForTimeout(400);

    const febPut = puts.find(r => r.p_month === 2);
    expect(febPut).toBeDefined();
    expect(febPut?.p_amount).toBe(1500);
  });

  test('Shift+Tab from December does not fill a non-existent month', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.fillAndShiftTab('Employment (Net)', 11, '1000');

    const dec = budgetPlanPage.getCellInput('Employment (Net)', 11);
    await expect(dec).toHaveValue('1,000.00');

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
    await budgetPlanPage.switchToEditTab();
    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toContainText('—');
  });

  test('shows allocation value when totals do not match', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '1000');

    const row = budgetPlanPage.getRemainingRow();
    await expect(row).toContainText('$1,000.00');
  });

  test('shows zero remaining when income equals outflow', async ({ budgetPlanPage }) => {
    await budgetPlanPage.switchToEditTab();
    await budgetPlanPage.setCategoryAmount('Employment (Net)', 0, '1000');
    await budgetPlanPage.setCategoryAmount('Rent', 0, '600');
    await budgetPlanPage.setCategoryAmount('Emergency Fund', 0, '300');
    await budgetPlanPage.setCategoryAmount('Credit Card Debt', 0, '100');

    const row = budgetPlanPage.getRemainingRow();
    // 1000 - 600 - 300 - 100 = 0, shows '—'
    await expect(row).toContainText('—');
  });
});
