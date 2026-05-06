import { test, expect } from '../../fixtures/base.fixture';
import { setupAllMocks } from '../../mocks/handlers';
import type { Transaction } from '../../../src/features/transactions/types';

const seedTransactions: Transaction[] = [
  { id: 'tx-1', date: '2026-02-01', amount: 3500, details: 'Monthly salary', accountId: '1', budgetType: 'Income', budgetPositionId: 'c1' },
  { id: 'tx-2', date: '2026-02-03', amount: -85.50, details: 'Walmart groceries', accountId: '1', budgetType: 'Expenses', budgetPositionId: 'c4' },
  { id: 'tx-3', date: '2026-02-05', amount: 500, details: 'Freelance work', accountId: '2', budgetType: 'Income', budgetPositionId: 'c2' },
  { id: 'tx-4', date: '2026-02-07', amount: -120, details: 'Electric bill', accountId: '3', budgetType: 'Expenses', budgetPositionId: 'c3' },
];

test.describe('Filter Transactions', () => {
  test.use({
    mockOptions: { transactions: { initialData: seedTransactions } },
  });

  test('should filter by Income type', async ({ transactionsPage }) => {
    await transactionsPage.filterByType('Income');
    await transactionsPage.table.expectRowCount(2);
    await expect(transactionsPage.table.getRowByText('Employment (Net)')).toBeVisible();
    await expect(transactionsPage.table.getRowByText('Side Hustle (Net)')).toBeVisible();
  });

  test('should filter by Expenses type', async ({ transactionsPage }) => {
    await transactionsPage.filterByType('Expenses');
    await transactionsPage.table.expectRowCount(2);
    await expect(transactionsPage.table.getRowByText('Groceries')).toBeVisible();
    await expect(transactionsPage.table.getRowByText('Rent')).toBeVisible();
  });

  test('should filter by specific account', async ({ transactionsPage }) => {
    await transactionsPage.filterByAccount('Cash on Hand');
    await transactionsPage.table.expectRowCount(1);
    await expect(transactionsPage.table.getRowByText('Side Hustle (Net)')).toBeVisible();
  });

  test('should combine type and account filter', async ({ transactionsPage }) => {
    await transactionsPage.filterByType('Expenses');
    await transactionsPage.filterByAccount('Credit Card 1');
    await transactionsPage.table.expectRowCount(1);
    await expect(transactionsPage.table.getRowByText('Rent')).toBeVisible();
  });

  test('should reset to All Types', async ({ transactionsPage }) => {
    await transactionsPage.filterByType('Income');
    await transactionsPage.table.expectRowCount(2);

    await transactionsPage.filterByType('All Types');
    await transactionsPage.table.expectRowCount(4);
  });

  test('should show no results for non-matching filter', async ({ transactionsPage }) => {
    await transactionsPage.filterByType('Savings');
    await expect(transactionsPage.table.emptyMessage).toBeVisible();
  });
});

test.describe('Filter Transactions by Month and Year', () => {
  test.use({
    mockOptions: {
      transactions: {
        initialData: [
          { id: 'tx-1', date: '2026-02-01', amount: 3500, details: 'Monthly salary', accountId: '1', budgetType: 'Income', budgetPositionId: 'c1' },
          { id: 'tx-2', date: '2026-02-03', amount: -85.50, details: 'Walmart groceries', accountId: '1', budgetType: 'Expenses', budgetPositionId: 'c4' },
          { id: 'tx-3', date: '2026-03-05', amount: 500, details: 'Freelance work', accountId: '2', budgetType: 'Income', budgetPositionId: 'c2' },
          { id: 'tx-4', date: '2025-02-07', amount: -120, details: 'Electric bill', accountId: '3', budgetType: 'Expenses', budgetPositionId: 'c3' },
        ],
      },
    },
  });

  test('should filter by selected month and year', async ({ transactionsPage }) => {
    await transactionsPage.filterByMonth('February');
    await transactionsPage.filterByYear('2026');

    await transactionsPage.table.expectRowCount(2);
  });

  test('should filter by selected year', async ({ transactionsPage }) => {
    await transactionsPage.filterByYear('2026');

    await transactionsPage.table.expectRowCount(3);
  });
});
