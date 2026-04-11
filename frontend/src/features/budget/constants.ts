import type { BudgetType } from '@/shared/types';

export const DISPLAY_LABELS: Partial<Record<BudgetType, string>> = {
  Debt: 'Liabilities',
};

// Raw hex values — must stay as hex (not CSS vars) so they can be used in
// inline style gradients and opacity suffixes, e.g. `${color}80`.
export const SECTION_ACCENT: Record<string, string> = {
  Income:   '#10b981',
  Expenses: '#ec4899',
  Savings:  '#6c5ce7',
  Debt:     '#38bdf8',
};

// Maps BudgetType to the kebab-case segment used in CSS custom properties,
// e.g. 'Income' → 'income' → var(--budget-income-header-bg).
export const SECTION_CSS_KEY: Record<string, string> = {
  Income:   'income',
  Expenses: 'expenses',
  Savings:  'savings',
  Debt:     'debt',
};

export const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function getCurrentBudgetMonth(year: number) {
  const now = new Date();
  return now.getFullYear() === year ? now.getMonth() + 1 : null;
}
