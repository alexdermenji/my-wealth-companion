import { useState, useCallback, useMemo } from 'react';
import { FinanceState, Transaction, BudgetCategory, Account, BudgetPlan, BudgetType } from './types';
import { loadState, saveState, genId } from './store';

export function useFinanceStore() {
  const [state, setState] = useState<FinanceState>(loadState);

  const update = useCallback((updater: (s: FinanceState) => FinanceState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    update(s => ({ ...s, transactions: [...s.transactions, { ...t, id: genId() }] }));
  }, [update]);

  const updateTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    update(s => ({
      ...s,
      transactions: s.transactions.map(tx => tx.id === id ? { ...tx, ...t } : tx),
    }));
  }, [update]);

  const deleteTransaction = useCallback((id: string) => {
    update(s => ({ ...s, transactions: s.transactions.filter(tx => tx.id !== id) }));
  }, [update]);

  // Accounts
  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    update(s => ({ ...s, accounts: [...s.accounts, { ...a, id: genId() }] }));
  }, [update]);

  const updateAccount = useCallback((id: string, a: Partial<Account>) => {
    update(s => ({
      ...s,
      accounts: s.accounts.map(acc => acc.id === id ? { ...acc, ...a } : acc),
    }));
  }, [update]);

  const deleteAccount = useCallback((id: string) => {
    update(s => ({ ...s, accounts: s.accounts.filter(a => a.id !== id) }));
  }, [update]);

  // Categories
  const addCategory = useCallback((c: Omit<BudgetCategory, 'id'>) => {
    update(s => ({ ...s, categories: [...s.categories, { ...c, id: genId() }] }));
  }, [update]);

  const updateCategory = useCallback((id: string, c: Partial<BudgetCategory>) => {
    update(s => ({
      ...s,
      categories: s.categories.map(cat => cat.id === id ? { ...cat, ...c } : cat),
    }));
  }, [update]);

  const deleteCategory = useCallback((id: string) => {
    update(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) }));
  }, [update]);

  // Budget Plans
  const setBudgetAmount = useCallback((categoryId: string, year: number, month: number, amount: number) => {
    update(s => {
      const existing = s.budgetPlans.find(b => b.categoryId === categoryId && b.year === year);
      if (existing) {
        return {
          ...s,
          budgetPlans: s.budgetPlans.map(b =>
            b.categoryId === categoryId && b.year === year
              ? { ...b, months: { ...b.months, [month]: amount } }
              : b
          ),
        };
      }
      return {
        ...s,
        budgetPlans: [...s.budgetPlans, { categoryId, year, months: { [month]: amount } }],
      };
    });
  }, [update]);

  // Settings
  const updateSettings = useCallback((settings: Partial<FinanceState['settings']>) => {
    update(s => ({ ...s, settings: { ...s.settings, ...settings } }));
  }, [update]);

  // Computed: get tracked amount for a category in a given month/year
  const getTrackedAmount = useCallback((categoryId: string, year: number, month: number) => {
    return state.transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.budgetPositionId === categoryId && d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [state.transactions]);

  const getBudgetAmount = useCallback((categoryId: string, year: number, month: number) => {
    const plan = state.budgetPlans.find(b => b.categoryId === categoryId && b.year === year);
    return plan?.months[month] ?? 0;
  }, [state.budgetPlans]);

  return {
    state,
    addTransaction, updateTransaction, deleteTransaction,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    setBudgetAmount, updateSettings,
    getTrackedAmount, getBudgetAmount,
  };
}
