import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { HiddenBudgetItems } from '../HiddenBudgetItems';
import type { BudgetCategory } from '@/shared/types';
const categories: BudgetCategory[] = [
  { id: 'a', name: 'Subscription', group: 'Work', type: 'Expenses', order: 0, isHiddenInBudget: true },
  { id: 'b', name: 'Subscription', group: 'Personal', type: 'Expenses', order: 1, isHiddenInBudget: true },
];
describe('Hidden budget list', () => {
  it('starts collapsed, distinguishes duplicate names, restores separately and keeps the rest expanded', () => {
    const restore = vi.fn();
    const props = { section: 'Expenses', onRestore: restore, pendingIds: new Set<string>(), buttonRef: createRef<HTMLButtonElement>() };
    const { rerender } = render(<HiddenBudgetItems {...props} categories={categories} />);
    const toggle = screen.getByRole('button', { name: 'Expenses: Hidden (2)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Restore Subscription (Work)' })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Restore Subscription (Work)' }));
    expect(restore).toHaveBeenCalledWith('a');
    rerender(<HiddenBudgetItems {...props} categories={categories} pendingIds={new Set(['a'])} />);
    expect(screen.getByRole('button', { name: 'Restore Subscription (Work)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restore Subscription (Personal)' })).toBeEnabled();
    rerender(<HiddenBudgetItems {...props} categories={categories.slice(1)} />);
    expect(screen.getByRole('button', { name: 'Expenses: Hidden (1)' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Restore Subscription (Personal)' })).toBeVisible();
  });
});
