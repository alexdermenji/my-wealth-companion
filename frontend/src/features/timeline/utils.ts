import { addMonths, format } from 'date-fns';
import type { BudgetPlan } from '@/features/budget/types';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';
import type { BudgetCategory } from '@/shared/types';

export interface DebtTimelineForecast {
  kind: 'forecast';
  itemId: string;
  name: string;
  group: string;
  linkedCategoryName: string | null;
  snapshotMonth: number;
  snapshotLabel: string;
  currentBalance: number;
  monthlyPayment: number;
  monthsToClose: number;
  projectedDate: Date;
  projectedLabel: string;
}

export interface DebtTimelineClosed {
  kind: 'closed';
  itemId: string;
  name: string;
  group: string;
  snapshotMonth: number;
  snapshotLabel: string;
}

export interface DebtTimelineUnforecasted {
  kind: 'unforecasted';
  itemId: string;
  name: string;
  group: string;
  currentBalance: number;
  snapshotMonth: number | null;
  snapshotLabel: string | null;
  reason: 'unlinked' | 'no-payment' | 'no-snapshot';
}

export interface DebtTimelineSummary {
  activeDebtCount: number;
  forecastableCount: number;
  totalActiveBalance: number;
  totalMonthlyPayment: number;
  nextPayoff: DebtTimelineForecast | null;
  debtFreeDate: DebtTimelineForecast | null;
}

export interface DebtTimelineModel {
  forecasted: DebtTimelineForecast[];
  closed: DebtTimelineClosed[];
  unforecasted: DebtTimelineUnforecasted[];
  summary: DebtTimelineSummary;
}

function getLatestSnapshotMonth(
  months: Record<number, number> | undefined,
  monthLimit: number,
): number | null {
  if (!months) return null;

  for (let month = monthLimit; month >= 1; month -= 1) {
    if (Object.prototype.hasOwnProperty.call(months, month)) return month;
  }

  return null;
}

function resolveMonthlyPayment(plan: BudgetPlan | undefined, anchorMonth: number): number {
  if (!plan) return 0;

  for (let month = anchorMonth; month >= 1; month -= 1) {
    const amount = plan.months[month] ?? 0;
    if (amount > 0) return amount;
  }

  for (let month = anchorMonth + 1; month <= 12; month += 1) {
    const amount = plan.months[month] ?? 0;
    if (amount > 0) return amount;
  }

  return 0;
}

export function buildDebtTimelineModel({
  year,
  monthLimit,
  items,
  values,
  budgetPlans,
  debtCategories,
}: {
  year: number;
  monthLimit: number;
  items: NetWorthItem[];
  values: NetWorthValue[];
  budgetPlans: BudgetPlan[];
  debtCategories: BudgetCategory[];
}): DebtTimelineModel {
  const valueMap = new Map(values.map(value => [value.itemId, value]));
  const planMap = new Map(budgetPlans.map(plan => [plan.categoryId, plan]));
  const categoryMap = new Map(debtCategories.map(category => [category.id, category]));

  const forecasted: DebtTimelineForecast[] = [];
  const closed: DebtTimelineClosed[] = [];
  const unforecasted: DebtTimelineUnforecasted[] = [];

  let activeDebtCount = 0;
  let totalActiveBalance = 0;
  let totalMonthlyPayment = 0;

  for (const item of items) {
    if (item.type !== 'Liability') continue;

    const itemValues = valueMap.get(item.id);
    const snapshotMonth = getLatestSnapshotMonth(itemValues?.months, monthLimit);
    const snapshotBalance = snapshotMonth === null ? 0 : (itemValues?.months[snapshotMonth] ?? 0);
    const snapshotLabel = snapshotMonth === null ? null : format(new Date(year, snapshotMonth - 1, 1), 'MMM yyyy');

    if (snapshotMonth === null) {
      unforecasted.push({
        kind: 'unforecasted',
        itemId: item.id,
        name: item.name,
        group: item.group,
        currentBalance: 0,
        snapshotMonth: null,
        snapshotLabel: null,
        reason: 'no-snapshot',
      });
      continue;
    }

    if (snapshotBalance <= 0) {
      closed.push({
        kind: 'closed',
        itemId: item.id,
        name: item.name,
        group: item.group,
        snapshotMonth,
        snapshotLabel: snapshotLabel!,
      });
      continue;
    }

    activeDebtCount += 1;
    totalActiveBalance += snapshotBalance;

    if (!item.linkedBudgetCategoryId) {
      unforecasted.push({
        kind: 'unforecasted',
        itemId: item.id,
        name: item.name,
        group: item.group,
        currentBalance: snapshotBalance,
        snapshotMonth,
        snapshotLabel,
        reason: 'unlinked',
      });
      continue;
    }

    const monthlyPayment = resolveMonthlyPayment(planMap.get(item.linkedBudgetCategoryId), snapshotMonth);
    if (monthlyPayment <= 0) {
      unforecasted.push({
        kind: 'unforecasted',
        itemId: item.id,
        name: item.name,
        group: item.group,
        currentBalance: snapshotBalance,
        snapshotMonth,
        snapshotLabel,
        reason: 'no-payment',
      });
      continue;
    }

    totalMonthlyPayment += monthlyPayment;

    const monthsToClose = Math.ceil(snapshotBalance / monthlyPayment);
    const projectedDate = addMonths(new Date(year, snapshotMonth - 1, 1), monthsToClose);

    forecasted.push({
      kind: 'forecast',
      itemId: item.id,
      name: item.name,
      group: item.group,
      linkedCategoryName: categoryMap.get(item.linkedBudgetCategoryId)?.name ?? null,
      snapshotMonth,
      snapshotLabel: snapshotLabel!,
      currentBalance: snapshotBalance,
      monthlyPayment,
      monthsToClose,
      projectedDate,
      projectedLabel: format(projectedDate, 'MMM yyyy'),
    });
  }

  forecasted.sort((a, b) => a.projectedDate.getTime() - b.projectedDate.getTime() || a.currentBalance - b.currentBalance);
  closed.sort((a, b) => b.snapshotMonth - a.snapshotMonth || a.name.localeCompare(b.name));
  unforecasted.sort((a, b) => a.name.localeCompare(b.name));

  return {
    forecasted,
    closed,
    unforecasted,
    summary: {
      activeDebtCount,
      forecastableCount: forecasted.length,
      totalActiveBalance,
      totalMonthlyPayment,
      nextPayoff: forecasted[0] ?? null,
      debtFreeDate: forecasted[forecasted.length - 1] ?? null,
    },
  };
}
