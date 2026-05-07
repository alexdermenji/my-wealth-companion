import type { BudgetType } from './common';

export type SpendingType = 'need' | 'want';

export interface BudgetCategory {
  id: string;
  name: string;
  type: BudgetType;
  group: string; // e.g. "Housing", "Fun", "Bills"
  order: number;
  spendingType?: SpendingType;
}
