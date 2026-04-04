import type { BudgetCategory } from '../../../src/shared/types/category';

export const mockCategories: BudgetCategory[] = [
  { id: 'c1', name: 'Employment (Net)', type: 'Income', group: 'Employment', order: 0 },
  { id: 'c2', name: 'Side Hustle (Net)', type: 'Income', group: 'Side Hustle', order: 1 },
  { id: 'c3', name: 'Rent', type: 'Expenses', group: 'Housing', order: 0 },
  { id: 'c4', name: 'Groceries', type: 'Expenses', group: 'Groceries', order: 1 },
  { id: 'c5', name: 'Emergency Fund', type: 'Savings', group: 'Savings', order: 0 },
  { id: 'c6', name: 'Credit Card Debt', type: 'Debt', group: 'Debt', order: 0 },
];
