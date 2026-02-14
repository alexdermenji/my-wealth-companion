import { test, expect } from '../../fixtures/base.fixture';
import { setupAllMocks } from '../../mocks/handlers';

test.describe('Add Transaction', () => {
  test('should add a transaction with all fields and see it in the table', async ({ transactionsPage }) => {
    const initialCount = await transactionsPage.table.getRowCount();

    await transactionsPage.addTransaction({
      date: '2026-02-14',
      amount: '-55.00',
      details: 'Coffee supplies',
      account: 'Bank Account',
      budgetType: 'Expenses',
      budgetPosition: 'Groceries',
    });

    await transactionsPage.table.expectRowCount(initialCount + 1);
    await transactionsPage.table.expectRowContains('Coffee supplies', ['$55.00']);
  });

  test('should add a positive (income) transaction', async ({ transactionsPage }) => {
    await transactionsPage.addTransaction({
      amount: '1200.00',
      details: 'Freelance payment',
      account: 'Bank Account',
      budgetType: 'Income',
      budgetPosition: 'Employment (Net)',
    });

    await transactionsPage.table.expectRowContains('Freelance payment', ['$1,200.00']);
  });

  test('should add a transaction without budget type/position', async ({ transactionsPage }) => {
    await transactionsPage.addTransaction({
      amount: '-20.00',
      details: 'Miscellaneous purchase',
      account: 'Cash on Hand',
    });

    await transactionsPage.table.expectRowContains('Miscellaneous purchase', ['$20.00']);
  });

  test('should close dialog without adding when cancelled', async ({ transactionsPage }) => {
    const initialCount = await transactionsPage.table.getRowCount();

    await transactionsPage.openAddDialog();
    await transactionsPage.form.amountInput.fill('999');
    await transactionsPage.page.keyboard.press('Escape');
    await transactionsPage.form.waitForClosed();

    await transactionsPage.table.expectRowCount(initialCount);
  });

  test('should not submit with empty amount', async ({ transactionsPage }) => {
    await transactionsPage.openAddDialog();
    await transactionsPage.form.amountInput.clear();
    await transactionsPage.form.submit();

    // Dialog should remain open since validation prevents close
    await expect(transactionsPage.form.dialog).toBeVisible();
  });

  test('should add to a different account', async ({ transactionsPage }) => {
    await transactionsPage.addTransaction({
      amount: '-150.00',
      details: 'Credit card purchase',
      account: 'Credit Card 1',
      budgetType: 'Expenses',
      budgetPosition: 'Groceries',
    });

    await transactionsPage.table.expectRowContains('Credit card purchase', ['Credit Card 1']);
  });

  test('should add multiple transactions sequentially', async ({ transactionsPage }) => {
    const initialCount = await transactionsPage.table.getRowCount();

    await transactionsPage.addTransaction({
      amount: '-30.00',
      details: 'First purchase',
      account: 'Bank Account',
    });

    await transactionsPage.addTransaction({
      amount: '-45.00',
      details: 'Second purchase',
      account: 'Bank Account',
    });

    await transactionsPage.table.expectRowCount(initialCount + 2);
  });

  test('should show budget positions filtered by selected type', async ({ transactionsPage }) => {
    await transactionsPage.openAddDialog();

    // Select Budget Type = Income
    const dialog = transactionsPage.form.dialog;
    const budgetTypeLabel = dialog.locator('label', { hasText: 'Budget Type' });
    const budgetTypeContainer = budgetTypeLabel.locator('..');
    await budgetTypeContainer.locator('button[role="combobox"]').click();

    const typeListbox = transactionsPage.page.locator('[role="listbox"]');
    await typeListbox.waitFor({ state: 'visible' });
    await typeListbox.getByRole('option', { name: 'Income', exact: true }).click();

    // Open Budget Position dropdown
    const posLabel = dialog.locator('label', { hasText: 'Budget Position' });
    const posContainer = posLabel.locator('..');
    await posContainer.locator('button[role="combobox"]').click();

    const posListbox = transactionsPage.page.locator('[role="listbox"]');
    await posListbox.waitFor({ state: 'visible' });

    // Should see Income categories
    await expect(posListbox.getByRole('option', { name: 'Employment (Net)' })).toBeVisible();
    await expect(posListbox.getByRole('option', { name: 'Side Hustle (Net)' })).toBeVisible();
    // Should NOT see Expenses categories
    await expect(posListbox.getByRole('option', { name: 'Groceries' })).not.toBeVisible();
  });
});

test.describe('Add Transaction - Empty State', () => {
  test.use({
    mockSetup: async ({ page }, use) => {
      const mocks = await setupAllMocks(page, {
        transactions: { initialData: [] },
      });
      await use(mocks);
    },
  });

  test('should show empty state and add first transaction', async ({ transactionsPage }) => {
    await expect(transactionsPage.table.emptyMessage).toBeVisible();

    await transactionsPage.addTransaction({
      amount: '5000.00',
      details: 'First ever transaction',
      account: 'Bank Account',
      budgetType: 'Income',
      budgetPosition: 'Employment (Net)',
    });

    await expect(transactionsPage.table.emptyMessage).not.toBeVisible();
    await transactionsPage.table.expectRowCount(1);
  });
});
