import { useEffect, useRef, useState } from 'react';
import type { BudgetPlan } from '../types';

interface UseTabFillParams {
  budgetPlans: BudgetPlan[];
  onAmountChange: (catId: string, month: number, value: string) => void;
}

/**
 * Manages optimistic tab-to-fill behaviour: when the user presses Shift+Tab on
 * a filled cell, the current value is copied to the next empty month and focus
 * advances automatically. Optimistic entries are dropped once the server round-
 * trip returns the real data.
 */
export function useTabFill({ budgetPlans, onAmountChange }: UseTabFillParams) {
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [tabFills, setTabFills] = useState<Record<string, string>>({});

  // Drop optimistic fills once React Query returns real values for those cells.
  useEffect(() => {
    if (Object.keys(tabFills).length === 0) return;
    setTabFills(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        const [catId, monthStr] = key.split('|');
        const plan = budgetPlans.find(bp => bp.categoryId === catId);
        if ((plan?.months[parseInt(monthStr, 10)] ?? 0) > 0) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [budgetPlans]); // eslint-disable-line react-hooks/exhaustive-deps

  const getBudget = (catId: string, month: number): number => {
    const fill = tabFills[`${catId}|${month}`];
    if (fill !== undefined) return parseFloat(fill) || 0;
    const plan = budgetPlans.find(bp => bp.categoryId === catId);
    return plan?.months[month] ?? 0;
  };

  const handleTab = (catId: string, month: number, value: string) => {
    if (month >= 12) return; // December — no next month to fill
    const nextMonth = month + 1;
    if (value && getBudget(catId, nextMonth) === 0) {
      // Apply optimistically so onFocus reads the value before the mutation settles.
      setTabFills(prev => ({ ...prev, [`${catId}|${nextMonth}`]: value }));
      onAmountChange(catId, nextMonth, value);
      // Defer focus so React can flush the state update first.
      setTimeout(() => cellRefs.current[`${catId}|${nextMonth}`]?.focus(), 0);
    } else {
      // Next cell already has a value — just move focus without overwriting.
      cellRefs.current[`${catId}|${nextMonth}`]?.focus();
    }
  };

  return { tabFills, getBudget, handleTab, cellRefs };
}
