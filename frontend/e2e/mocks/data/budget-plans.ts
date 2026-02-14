import type { BudgetPlan } from '../../../src/features/budget/types';

export const mockBudgetPlans: BudgetPlan[] = [
  { categoryId: 'c1', year: 2026, months: { 1: 4000, 2: 4000, 3: 4000 } },
  { categoryId: 'c2', year: 2026, months: { 1: 1000, 2: 1000 } },
  { categoryId: 'c3', year: 2026, months: { 1: 1200, 2: 1200, 3: 1200 } },
  { categoryId: 'c4', year: 2026, months: { 1: 800, 2: 800, 3: 800 } },
  { categoryId: 'c5', year: 2026, months: { 1: 500, 2: 500 } },
  { categoryId: 'c6', year: 2026, months: { 1: 300, 2: 300 } },
];
