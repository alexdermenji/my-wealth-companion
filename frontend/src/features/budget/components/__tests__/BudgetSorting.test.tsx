import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReorderCategory } from '@/shared/hooks/useCategories';
import type { BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../../types';
import { BudgetSection } from '../BudgetSection';
import { BudgetSectionMobile } from '../mobile/BudgetSectionMobile';
vi.mock('@/shared/hooks/useCategories');
vi.mock('@/features/settings/components/CategoryFormDialog', () => ({ CategoryFormDialog: () => null }));
const categories: BudgetCategory[] = ['Alpha', 'Beta', 'Gamma'].map((name, order) => ({ id: name, name, type: 'Expenses', group: 'Bills', order }));
const plans: BudgetPlan[] = [
  { categoryId: 'Alpha', year: 2026, months: { 1: 10, 2: 50 } },
  { categoryId: 'Beta', year: 2026, months: { 1: 30, 2: 5 } },
];
const props = { type: 'Expenses' as const, categories, budgetPlans: plans, onAmountChange: vi.fn() };
const order = () => screen.getAllByText(/^(Alpha|Beta|Gamma)$/).map(el => el.textContent);
const button = (month = 'Jan') => screen.getByRole('button', { name: new RegExp(`^Expenses, ${month}:`) });
const desktop = (budgetPlans = plans, cats = categories) => <table><tbody><BudgetSection {...props} categories={cats} budgetPlans={budgetPlans} /></tbody></table>;
describe('budget sorting interactions', () => {
  beforeEach(() => vi.clearAllMocks());
  it('cycles via keyboard, preserves totals, disables dragging and never persists order', async () => {
    const user = userEvent.setup();
    render(desktop());
    const total = screen.getByText('Total Expenses').closest('tr')!.textContent;
    button().focus();
    await user.keyboard('{Enter}');
    expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect(button().closest('[role="columnheader"]')).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByText('Alpha').closest('tr')).toHaveAttribute('draggable', 'false');
    await user.keyboard(' ');
    expect(order()).toEqual(['Gamma', 'Alpha', 'Beta']);
    await user.keyboard('{Enter}');
    expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(screen.getByText('Alpha').closest('tr')).toHaveAttribute('draggable', 'true');
    expect(screen.getByText('Total Expenses').closest('tr')!.textContent).toBe(total);
    expect(useReorderCategory().mutate).not.toHaveBeenCalled();
  });
  it('switches months and responds to added data and removed categories', () => {
    const { rerender } = render(desktop());
    fireEvent.click(button());
    fireEvent.click(button('Feb'));
    expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
    rerender(desktop([...plans, { categoryId: 'Gamma', year: 2026, months: { 2: 100 } }]));
    expect(order()).toEqual(['Gamma', 'Alpha', 'Beta']);
    rerender(desktop(plans, categories.filter(c => c.id !== 'Alpha')));
    expect(order()).toEqual(['Beta', 'Gamma']);
  });
  it('keeps draft input in place and reorders only from updated data', () => {
    const { rerender } = render(desktop());
    fireEvent.click(button());
    const input = within(screen.getByText('Alpha').closest('tr')!).getAllByRole('textbox')[0];
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '70' } });
    expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect(props.onAmountChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(props.onAmountChange).toHaveBeenCalledWith('Alpha', 1, '70');
    rerender(desktop());
    expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);
    rerender(desktop([{ ...plans[0], months: { 1: 70 } }, plans[1]]));
    expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
  it('fills the next month of the same category and preserves focus', async () => {
    render(desktop());
    fireEvent.click(button('Mar'));
    const inputs = within(screen.getByText('Alpha').closest('tr')!).getAllByRole('textbox');
    fireEvent.focus(inputs[1]);
    fireEvent.change(inputs[1], { target: { value: '80' } });
    fireEvent.keyDown(inputs[1], { key: 'Tab', shiftKey: true });
    await waitFor(() => expect(inputs[2]).toHaveFocus());
    expect(props.onAmountChange).toHaveBeenCalledWith('Alpha', 3, '80');
    expect(inputs[2]).toHaveValue('80.00');
  });
  it('supports three modes on mobile and retains direction for a new month', () => {
    const ui = (month: number) => <BudgetSectionMobile {...props} currency="£" month={month} />;
    const { rerender } = render(ui(1));
    fireEvent.click(button());
    expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);
    rerender(ui(2));
    expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
    fireEvent.click(button('Feb'));
    expect(order()).toEqual(['Gamma', 'Beta', 'Alpha']);
    fireEvent.click(button('Feb'));
    expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
  it('edits the correct mobile category without moving its draft', () => {
    const ui = (budgetPlans: BudgetPlan[]) => <BudgetSectionMobile {...props} budgetPlans={budgetPlans} currency="£" month={1} />;
    const { rerender } = render(ui(plans));
    fireEvent.click(button());
    const input = screen.getAllByRole('textbox')[1];
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '75' } });
    expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);
    fireEvent.blur(input);
    expect(props.onAmountChange).toHaveBeenCalledWith('Alpha', 1, '75');
    rerender(ui([{ ...plans[0], months: { 1: 75 } }, plans[1]]));
    expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
