import type { BudgetCategory } from '../../../src/shared/types/category';

export const mockCategories: BudgetCategory[] = [
  { id: 'c1', name: 'Employment (Net)', type: 'Income', group: 'Employment' },
  { id: 'c2', name: 'Side Hustle (Net)', type: 'Income', group: 'Side Hustle' },
  { id: 'c3', name: 'Rent', type: 'Expenses', group: 'Housing' },
  { id: 'c4', name: 'Groceries', type: 'Expenses', group: 'Groceries' },
  { id: 'c5', name: 'Emergency Fund', type: 'Savings', group: 'Savings' },
  { id: 'c6', name: 'Credit Card Debt', type: 'Debt', group: 'Debt' },
];
