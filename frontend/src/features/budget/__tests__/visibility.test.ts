import { describe, expect, it } from 'vitest';
import type { BudgetCategory } from '@/shared/types';
import { partitionBudgetCategories, moveVisibleBudgetCategory } from '../visibility';
const categories: BudgetCategory[] = ['h0', 'a', 'h1', 'b', 'h2', 'c', 'h3'].map((id, order) => ({
  id, name: id, type: 'Expenses', group: 'Bills', order, isHiddenInBudget: id.startsWith('h'),
}));
describe('budget visibility and manual order', () => {
  it('partitions empty, mixed and fully hidden lists without losing or changing rows', () => {
    expect(partitionBudgetCategories([])).toEqual({ visible: [], hidden: [] });
    expect(partitionBudgetCategories(categories).visible.map(c => c.id)).toEqual(['a', 'b', 'c']);
    expect(partitionBudgetCategories(categories).hidden.map(c => c.id)).toEqual(['h0', 'h1', 'h2', 'h3']);
    expect(partitionBudgetCategories(categories.map(c => ({ ...c, isHiddenInBudget: true }))).visible).toEqual([]);
  });
  it.each([
    ['c', 0, 1, ['h0', 'c', 'a', 'h1', 'b', 'h2', 'h3']],
    ['a', 2, 5, ['h0', 'h1', 'b', 'h2', 'c', 'a', 'h3']],
    ['a', 1, 4, ['h0', 'h1', 'b', 'h2', 'a', 'c', 'h3']],
    ['c', 1, 3, ['h0', 'a', 'h1', 'c', 'b', 'h2', 'h3']],
  ])('moves %s to visible position %s using the full-list destination', (id, destination, newOrder, ids) => {
    const result = moveVisibleBudgetCategory(categories, id, destination)!;
    expect(result.newOrder).toBe(newOrder);
    expect(result.categories.map(c => c.id)).toEqual(ids);
    expect(new Set(result.categories.map(c => c.id)).size).toBe(categories.length);
    expect(categories.map(c => c.id)).toEqual(['h0', 'a', 'h1', 'b', 'h2', 'c', 'h3']);
  });
  it('ignores hidden/unknown dragged elements and no-op moves', () => {
    expect(moveVisibleBudgetCategory(categories, 'h1', 0)).toBeNull();
    expect(moveVisibleBudgetCategory(categories, 'missing', 0)).toBeNull();
    expect(moveVisibleBudgetCategory(categories, 'a', 0)).toBeNull();
    expect(moveVisibleBudgetCategory([categories[1]], 'a', 0)).toBeNull();
  });
});
