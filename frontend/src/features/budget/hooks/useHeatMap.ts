import { useMemo } from 'react';
import type { BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { ALL_MONTHS } from '../constants';

interface UseHeatMapParams {
  typeCats: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  tabFills: Record<string, string>;
  cssKey: string;
}

/**
 * Pre-computes monthly section totals and provides a heat-map background
 * calculator using a rank-based intensity scale.
 *
 * Rank-based (vs value-based) means every pair of months with different totals
 * always gets a perceptibly different shade, regardless of how close the actual
 * numbers are. Ties share the same shade.
 */
export function useHeatMap({ typeCats, budgetPlans, tabFills, cssKey }: UseHeatMapParams) {
  const monthTotals = useMemo(() => {
    const result: Record<number, number> = {};
    for (const mo of ALL_MONTHS) {
      result[mo] = typeCats.reduce((sum, cat) => {
        const fill = tabFills[`${cat.id}|${mo}`];
        if (fill !== undefined) return sum + (parseFloat(fill) || 0);
        const plan = budgetPlans.find(bp => bp.categoryId === cat.id);
        return sum + (plan?.months[mo] ?? 0);
      }, 0);
    }
    return result;
  }, [typeCats, budgetPlans, tabFills]);

  // Sorted unique totals used for rank lookup. Null when all months are equal
  // (no variation to encode — cells fall back to the plain header background).
  const uniqueSorted = useMemo(() => {
    const vals = ALL_MONTHS.map(mo => monthTotals[mo]);
    const sorted = [...new Set(vals)].sort((a, b) => a - b);
    return sorted.length > 1 ? sorted : null;
  }, [monthTotals]);

  /** Returns the CSS rgba() background for a given month's total cell. */
  const getHeatBg = (mo: number, fallback: string): string => {
    if (!uniqueSorted) return fallback;
    const total = monthTotals[mo] ?? 0;
    const rank = uniqueSorted.indexOf(total);
    const intensity = rank / (uniqueSorted.length - 1);
    return `rgba(var(--budget-${cssKey}-rgb), ${(0.05 + intensity * 0.45).toFixed(2)})`;
  };

  return { monthTotals, getHeatBg };
}
