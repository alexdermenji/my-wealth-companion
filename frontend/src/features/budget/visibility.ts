import type { BudgetCategory } from '@/shared/types';

export function partitionBudgetCategories(categories: BudgetCategory[]) {
  return {
    visible: categories.filter(category => !category.isHiddenInBudget),
    hidden: categories.filter(category => category.isHiddenInBudget),
  };
}

/** Translate a visible drop position into the full sibling order used by the RPC. */
export function moveVisibleBudgetCategory(categories: BudgetCategory[], id: string, destination: number) {
  const { visible } = partitionBudgetCategories(categories);
  const from = visible.findIndex(category => category.id === id);
  if (from < 0) return null;
  const to = Math.max(0, Math.min(destination, visible.length - 1));
  if (from === to) return null;
  const moved = visible[from];
  const remaining = categories.filter(category => category.id !== id);
  const remainingVisible = visible.filter(category => category.id !== id);
  const next = remainingVisible[to];
  const last = remainingVisible[remainingVisible.length - 1];
  const newOrder = next
    ? remaining.findIndex(category => category.id === next.id)
    : remaining.findIndex(category => category.id === last.id) + 1;
  const reordered = [...remaining];
  reordered.splice(newOrder, 0, moved);
  return { categories: reordered, newOrder };
}
