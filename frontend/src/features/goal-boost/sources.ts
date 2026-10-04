import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';
import type { BudgetPlan } from '@/features/budget/types';
import { format } from 'date-fns';
export function selectForecastSources(
  categoryId: string,
  items: NetWorthItem[],
  values: NetWorthValue[],
  plans: BudgetPlan[],
  now: Date,
) {
  const candidates = items.filter(
    (i) => i.type === 'Liability' && i.linkedBudgetCategoryId === categoryId,
  );
  const snapshots =
    candidates.length === 1
      ? values
          .filter((v) => v.itemId === candidates[0].id)
          .flatMap((v) =>
            Object.entries(v.months).map(([month, value]) => ({
              date: `${v.year}-${String(month).padStart(2, '0')}-01`,
              value,
            })),
          )
          .filter((v) => v.date <= format(now, 'yyyy-MM-dd'))
          .sort((a, b) => b.date.localeCompare(a.date))
      : [];
  return {
    balance: snapshots[0]?.value,
    balanceDate: snapshots[0]?.date,
    itemName: candidates.length === 1 ? candidates[0].name : undefined,
    payment: plans.find(
      (p) => p.categoryId === categoryId && p.year === now.getFullYear(),
    )?.months[now.getMonth() + 1],
    ambiguous: candidates.length > 1,
  };
}
