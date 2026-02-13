export type BudgetType = 'Income' | 'Expenses' | 'Savings' | 'Debt' | 'Transfer';

export interface Account {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'Credit Card' | 'Investment' | 'Retirement' | 'Loan' | 'Other';
}

export interface BudgetCategory {
  id: string;
  name: string;
  type: BudgetType;
  group: string; // e.g. "Housing", "Fun", "Bills"
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  amount: number;
  details: string;
  accountId: string;
  budgetType: BudgetType | '';
  budgetPositionId: string; // links to BudgetCategory.id
}

export interface BudgetPlan {
  categoryId: string;
  year: number;
  // monthly amounts keyed by month (1-12)
  months: Record<number, number>;
}

export interface FinanceState {
  accounts: Account[];
  categories: BudgetCategory[];
  transactions: Transaction[];
  budgetPlans: BudgetPlan[];
  settings: {
    startYear: number;
    startMonth: number;
    currency: string;
  };
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BUDGET_TYPE_COLORS: Record<BudgetType | '', string> = {
  'Income': 'income',
  'Expenses': 'expense',
  'Savings': 'savings',
  'Debt': 'debt',
  'Transfer': 'transfer',
  '': 'muted-foreground',
};
