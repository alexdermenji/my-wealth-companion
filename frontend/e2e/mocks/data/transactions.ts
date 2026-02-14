import type { Transaction } from '../../../src/features/transactions/types';

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '2026-02-01',
    amount: 3500,
    details: 'Monthly salary',
    accountId: '1',
    budgetType: 'Income',
    budgetPositionId: 'c1',
  },
  {
    id: 'tx-2',
    date: '2026-02-03',
    amount: -85.50,
    details: 'Walmart groceries',
    accountId: '1',
    budgetType: 'Expenses',
    budgetPositionId: 'c4',
  },
];

let nextId = 100;
export function createMockTransaction(data: Omit<Transaction, 'id'>): Transaction {
  return { id: `tx-${nextId++}`, ...data };
}

export function resetMockTransactionId() {
  nextId = 100;
}
