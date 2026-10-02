import type { BudgetCategory } from '@/shared/types';

export type BudgetSort = { month: number; direction: 'descending' | 'ascending' } | null;

export function nextBudgetSort(sort: BudgetSort, month: number): BudgetSort {
  if (!sort || sort.month !== month) return { month, direction: 'descending' };
  return sort.direction === 'descending' ? { month, direction: 'ascending' } : null;
}

/** The input is in manual order; stable sorting preserves it for equal amounts. */
export function sortBudgetCategories(
  categories: BudgetCategory[],
  sort: BudgetSort,
  getAmount: (categoryId: string, month: number) => number,
): BudgetCategory[] {
  if (!sort) return categories;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...categories].sort((a, b) => sign * (getAmount(a.id, sort.month) - getAmount(b.id, sort.month)));
}
