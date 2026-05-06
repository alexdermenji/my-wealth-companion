import { test, expect } from '../../fixtures/base.fixture';
import { setupAllMocks } from '../../mocks/handlers';

test.describe('Delete Transaction', () => {
  test('should delete a transaction', async ({ transactionsPage }) => {
    await transactionsPage.table.expectRowCount(2);

    await transactionsPage.table.clickDelete('Groceries');

    await transactionsPage.table.expectRowCount(1);
    await expect(transactionsPage.table.getRowByText('Groceries')).toHaveCount(0);
  });

  test('should delete all and show empty state', async ({ transactionsPage }) => {
    await transactionsPage.table.clickDelete('Employment (Net)');
    await transactionsPage.table.clickDelete('Groceries');

    await expect(transactionsPage.table.emptyMessage).toBeVisible();
  });

  test('should delete newly added transaction', async ({ transactionsPage }) => {
    await transactionsPage.addTransaction({
      amount: '25.00',
      account: 'Bank Account',
      budgetType: 'Expenses',
      budgetPosition: 'Groceries',
    });

    await transactionsPage.table.expectRowCount(3);
    await transactionsPage.table.clickDeleteByIndex(2); // delete the newly added row
    await transactionsPage.table.expectRowCount(2);
  });
});
