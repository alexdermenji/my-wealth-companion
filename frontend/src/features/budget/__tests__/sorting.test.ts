import { describe, expect, it } from 'vitest';
import type { BudgetCategory } from '@/shared/types';
import { sortBudgetCategories, nextBudgetSort } from '../sorting';
const cats: BudgetCategory[] = ['small', 'large', 'equal', 'zero', 'missing'].map((id, order) => ({ id, name: id, type: 'Expenses', group: '', order }));
const amounts: Record<string, number> = { small: 9.5, large: 1000.25, equal: 9.5, zero: 0 };
const getAmount = (id: string) => amounts[id] ?? 0;
describe('budget sorting', () => {
  it('sorts numbers stably in both directions without changing manual order', () => {
    expect(sortBudgetCategories(cats, { month: 1, direction: 'descending' }, getAmount).map(c => c.id)).toEqual(['large', 'small', 'equal', 'zero', 'missing']);
    expect(sortBudgetCategories(cats, { month: 1, direction: 'ascending' }, getAmount).map(c => c.id)).toEqual(['zero', 'missing', 'small', 'equal', 'large']);
    expect(cats.map(c => c.id)).toEqual(['small', 'large', 'equal', 'zero', 'missing']);
    expect(sortBudgetCategories(cats, null, getAmount)).toEqual(cats);
  });
  it('handles empty and single-category sections', () => {
    const sort = { month: 12, direction: 'ascending' } as const;
    expect(sortBudgetCategories([], sort, getAmount)).toEqual([]);
    expect(sortBudgetCategories(cats.slice(0, 1), sort, getAmount)).toEqual(cats.slice(0, 1));
  });
  it('cycles directions and starts descending for another month', () => {
    const descending = nextBudgetSort(null, 2);
    expect(descending).toEqual({ month: 2, direction: 'descending' });
    const ascending = nextBudgetSort(descending, 2);
    expect(ascending).toEqual({ month: 2, direction: 'ascending' });
    expect(nextBudgetSort(ascending, 2)).toBeNull();
    expect(nextBudgetSort(ascending, 3)).toEqual({ month: 3, direction: 'descending' });
  });
});
