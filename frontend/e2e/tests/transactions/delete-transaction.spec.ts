import { test, expect } from '../../fixtures/base.fixture';
import { setupAllMocks } from '../../mocks/handlers';

test.describe('Delete Transaction', () => {
  test('should delete a transaction', async ({ transactionsPage }) => {
    await transactionsPage.table.expectRowCount(2);

    await transactionsPage.table.clickDelete('Walmart groceries');

    await transactionsPage.table.expectRowCount(1);
    await expect(transactionsPage.table.getRowByDetails('Walmart groceries')).toHaveCount(0);
  });

  test('should delete all and show empty state', async ({ transactionsPage }) => {
    await transactionsPage.table.clickDelete('Monthly salary');
    await transactionsPage.table.clickDelete('Walmart groceries');

    await expect(transactionsPage.table.emptyMessage).toBeVisible();
  });

  test('should delete newly added transaction', async ({ transactionsPage }) => {
    await transactionsPage.addTransaction({
      amount: '-25.00',
      details: 'Temp purchase',
      account: 'Bank Account',
    });

    await transactionsPage.table.expectRowCount(3);
    await transactionsPage.table.clickDelete('Temp purchase');
    await transactionsPage.table.expectRowCount(2);
  });
});
