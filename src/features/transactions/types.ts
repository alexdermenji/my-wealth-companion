import type { BudgetType } from '@/shared/types';

export interface Transaction {
  id: string;
  date: string; // ISO date
  amount: number;
  details: string;
  accountId: string;
  budgetType: BudgetType | '';
  budgetPositionId: string; // links to BudgetCategory.id
}
