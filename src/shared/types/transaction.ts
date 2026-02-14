import type { BudgetType } from './common';

export interface Transaction {
  id: string;
  date: string; // ISO date
  amount: number;
  details: string;
  accountId: string;
  budgetType: BudgetType | '';
  budgetPositionId: string; // links to BudgetCategory.id
}
