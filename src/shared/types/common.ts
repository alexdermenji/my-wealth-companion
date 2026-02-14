export type BudgetType = 'Income' | 'Expenses' | 'Savings' | 'Debt' | 'Transfer';

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BUDGET_TYPE_COLORS: Record<BudgetType | '', string> = {
  'Income': 'income',
  'Expenses': 'expense',
  'Savings': 'savings',
  'Debt': 'debt',
  'Transfer': 'transfer',
  '': 'muted-foreground',
};
