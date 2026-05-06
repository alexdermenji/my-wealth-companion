import { test, expect } from '../../fixtures/base.fixture';
import type { Transaction } from '../../../src/features/transactions/types';

const manyTransactions: Transaction[] = Array.from({ length: 30 }, (_, index) => {
  const day = String(index + 1).padStart(2, '0');
  return {
    id: `tx-${index + 1}`,
    date: `2026-01-${day}`,
    amount: 100 + index,
    details: `Transaction ${index + 1}`,
    accountId: '1',
    budgetType: 'Income',
    budgetPositionId: 'c1',
  };
});

test.describe('Paginate Transactions', () => {
  test.use({
    mockOptions: { transactions: { initialData: manyTransactions } },
  });

  test('should page through transaction results', async ({ transactionsPage }) => {
    await transactionsPage.table.expectRowCount(25);
    await expect(transactionsPage.page.getByText('1-25 of 30')).toBeVisible();
    await expect(transactionsPage.page.getByRole('button', { name: /previous page/i })).toBeDisabled();

    await transactionsPage.page.getByRole('button', { name: /next page/i }).click();

    await transactionsPage.table.expectRowCount(5);
    await expect(transactionsPage.page.getByText('26-30 of 30')).toBeVisible();
    await expect(transactionsPage.page.getByRole('button', { name: /next page/i })).toBeDisabled();
  });
});
