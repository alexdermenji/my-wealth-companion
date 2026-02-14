import type { BudgetType } from './common';

export interface BudgetCategory {
  id: string;
  name: string;
  type: BudgetType;
  group: string; // e.g. "Housing", "Fun", "Bills"
  groupEmoji: string;
}
