import { FinanceState, Account, BudgetCategory, Transaction, BudgetPlan } from './types';

const STORAGE_KEY = 'personal-finance-data';

const defaultState: FinanceState = {
  accounts: [
    { id: '1', name: 'Bank Account', type: 'Bank' },
    { id: '2', name: 'Cash on Hand', type: 'Cash' },
    { id: '3', name: 'Credit Card 1', type: 'Credit Card' },
  ],
  categories: [
    { id: 'c1', name: 'Employment (Net)', type: 'Income', group: 'Work Income' },
    { id: 'c2', name: 'Side Hustle (Net)', type: 'Income', group: 'Work Income' },
    { id: 'c3', name: 'Dividends (Net)', type: 'Income', group: 'Capital Income' },
    { id: 'c4', name: 'Rent', type: 'Expenses', group: 'Housing' },
    { id: 'c5', name: 'Utilities', type: 'Expenses', group: 'Housing' },
    { id: 'c6', name: 'Internet', type: 'Expenses', group: 'Housing' },
    { id: 'c7', name: 'Groceries', type: 'Expenses', group: 'Groceries' },
    { id: 'c8', name: 'Going Out', type: 'Expenses', group: 'Fun' },
    { id: 'c9', name: 'Shopping', type: 'Expenses', group: 'Fun' },
    { id: 'c10', name: 'Gym', type: 'Expenses', group: 'Self-Care' },
    { id: 'c11', name: 'Body Care & Medicine', type: 'Expenses', group: 'Self-Care' },
    { id: 'c12', name: 'Car Gas', type: 'Expenses', group: 'Transportation' },
    { id: 'c13', name: 'Metro Ticket', type: 'Expenses', group: 'Transportation' },
    { id: 'c14', name: 'Netflix', type: 'Expenses', group: 'Entertainment' },
    { id: 'c15', name: 'Roth IRA', type: 'Savings', group: 'Retirement' },
    { id: 'c16', name: 'Emergency Fund', type: 'Savings', group: 'Emergency' },
    { id: 'c17', name: 'Stock Portfolio', type: 'Savings', group: 'Investments' },
    { id: 'c18', name: 'Car Loan', type: 'Debt', group: 'Car Debt' },
    { id: 'c19', name: 'Credit Card Debt', type: 'Debt', group: 'Credit Card Debt' },
    { id: 'c20', name: 'Undergraduate Loan', type: 'Debt', group: 'Student Loan Debt' },
  ],
  transactions: [],
  budgetPlans: [],
  settings: {
    startYear: 2026,
    startMonth: 1,
    currency: '$',
  },
};

export function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return defaultState;
}

export function saveState(state: FinanceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Helper to generate IDs
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
