import type { Transaction, BudgetCategory } from '@/shared/types';

export interface WantsNeedsSplit {
  wantsAmount: number;
  needsAmount: number;
  incomeAmount: number;
  wantsPct: number;
  needsPct: number;
}

export function computeWantsNeedsSplit(
  transactions: Transaction[],
  categories: BudgetCategory[],
  // When provided, used as denominator for percentages instead of actual income.
  // Avoids wild percentages mid-month when salary hasn't landed yet.
  referenceIncome?: number,
): WantsNeedsSplit {
  const incomeAmount = transactions
    .filter(tx => tx.budgetType === 'Income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  let wantsAmount = 0;
  let needsAmount = 0;

  transactions
    .filter(tx => tx.budgetType === 'Expenses' || tx.budgetType === 'Debt')
    .forEach(tx => {
      if (tx.budgetType === 'Debt') {
        needsAmount += Math.abs(tx.amount);
        return;
      }
      const cat = categories.find(c => c.id === tx.budgetPositionId);
      if (!cat?.spendingType) return;
      if (cat.spendingType === 'want') {
        wantsAmount += Math.abs(tx.amount);
      } else {
        needsAmount += Math.abs(tx.amount);
      }
    });

  const base = referenceIncome || incomeAmount;
  const wantsPct = base > 0 ? Math.round((wantsAmount / base) * 100) : 0;
  const needsPct = base > 0 ? Math.round((needsAmount / base) * 100) : 0;

  return { wantsAmount, needsAmount, incomeAmount, wantsPct, needsPct };
}
