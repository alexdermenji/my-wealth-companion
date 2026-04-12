import { useMemo } from 'react';
import type { NetWorthItem, NetWorthValue } from '../types';
import { ALL_MONTHS } from '../constants';

interface UseNetWorthHeatMapParams {
  typeItems: NetWorthItem[];
  values: NetWorthValue[];
  tabFills: Record<string, string>;
  cssKey: string;
}

export function useNetWorthHeatMap({ typeItems, values, tabFills, cssKey }: UseNetWorthHeatMapParams) {
  const monthTotals = useMemo(() => {
    const result: Record<number, number> = {};
    for (const mo of ALL_MONTHS) {
      result[mo] = typeItems.reduce((sum, item) => {
        const fill = tabFills[`${item.id}|${mo}`];
        if (fill !== undefined) return sum + (parseFloat(fill) || 0);
        const val = values.find(v => v.itemId === item.id);
        return sum + (val?.months[mo] ?? 0);
      }, 0);
    }
    return result;
  }, [typeItems, values, tabFills]);

  const uniqueSorted = useMemo(() => {
    const vals = ALL_MONTHS.map(mo => monthTotals[mo]);
    const sorted = [...new Set(vals)].sort((a, b) => a - b);
    return sorted.length > 1 ? sorted : null;
  }, [monthTotals]);

  const getHeatBg = (mo: number, fallback: string): string => {
    if (!uniqueSorted) return fallback;
    const total = monthTotals[mo] ?? 0;
    const rank = uniqueSorted.indexOf(total);
    const intensity = rank / (uniqueSorted.length - 1);
    return `rgba(var(--nw-${cssKey}-rgb), ${(0.05 + intensity * 0.45).toFixed(2)})`;
  };

  return { monthTotals, getHeatBg };
}
