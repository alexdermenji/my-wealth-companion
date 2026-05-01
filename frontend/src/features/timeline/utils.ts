import { addMonths, format, parseISO } from 'date-fns';
import type { BudgetPlan } from '@/features/budget/types';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';
import type { BudgetCategory } from '@/shared/types';
import type { TimelineEvent } from './types';

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

export interface TimelineCustomEventEntry {
  kind: 'custom';
  id: string;
  event: TimelineEvent;
  title: string;
  description: string;
  amount: number | null;
  eventDate: string;
  date: Date;
  dateLabel: string;
  type: TimelineEvent['type'];
}

export interface TimelineDebtEntry {
  kind: 'debt';
  forecast: DebtTimelineForecast;
  date: Date;
  dateLabel: string;
}

export type TimelineFeedEntry = TimelineDebtEntry | TimelineCustomEventEntry;

export interface NetWorthTimelinePoint {
  year: number;
  month: number;
  label: string;
  date: Date;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface UserMilestone {
  id: string;
  amount: number;
  label: string | null;
  targetDate: string | null;
  note: string;
}

export interface NetWorthMilestone {
  id: string;
  amount: number;
  label: string;
  status: 'reached' | 'on-track' | 'off-track' | 'projected' | 'unavailable';
  monthLabel: string | null;
  monthsAway: number | null;
  currentNetWorth: number;
  targetDate: string | null;
  note: string;
}

export interface NetWorthMilestoneModel {
  points: NetWorthTimelinePoint[];
  latestPoint: NetWorthTimelinePoint | null;
  monthlyGrowth: number | null;
  milestones: NetWorthMilestone[];
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

function monthDistance(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): number {
  return ((toYear - fromYear) * 12) + (toMonth - fromMonth);
}

export function formatMilestoneLabel(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k`;
  }
  return `${amount}`;
}

function getMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
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

export function buildNetWorthMilestoneModel({
  items,
  values,
  milestones,
}: {
  items: NetWorthItem[];
  values: NetWorthValue[];
  milestones: UserMilestone[];
}): NetWorthMilestoneModel {
  const itemTypeMap = new Map(items.map(item => [item.id, item.type]));
  const pointMap = new Map<string, NetWorthTimelinePoint>();

  for (const value of values) {
    const type = itemTypeMap.get(value.itemId);
    if (!type) continue;

    for (let month = 1; month <= 12; month += 1) {
      if (!Object.prototype.hasOwnProperty.call(value.months, month)) continue;

      const key = `${value.year}-${month}`;
      if (!pointMap.has(key)) {
        const date = new Date(value.year, month - 1, 1);
        pointMap.set(key, {
          year: value.year,
          month,
          label: format(date, 'MMM yyyy'),
          date,
          assets: 0,
          liabilities: 0,
          netWorth: 0,
        });
      }

      const point = pointMap.get(key)!;
      const amount = value.months[month] ?? 0;
      if (type === 'Asset') point.assets += amount;
      else point.liabilities += amount;
      point.netWorth = point.assets - point.liabilities;
    }
  }

  const points = Array.from(pointMap.values()).sort((a, b) => (
    a.year - b.year || a.month - b.month
  ));
  const latestPoint = points.at(-1) ?? null;

  const monthlyizedDeltas: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const span = monthDistance(previous.year, previous.month, current.year, current.month);
    if (span <= 0) continue;
    monthlyizedDeltas.push((current.netWorth - previous.netWorth) / span);
  }

  const recentTrendWindow = monthlyizedDeltas.slice(-12);
  const monthlyGrowth = getMedian(recentTrendWindow.length >= 6 ? recentTrendWindow : monthlyizedDeltas);

  const milestoneRows = milestones.map(m => {
    const { id, amount, targetDate, note } = m;
    const label = m.label ?? formatMilestoneLabel(amount);
    const base = { id, amount, label, targetDate, note, currentNetWorth: latestPoint?.netWorth ?? 0 };

    const reachedPoint = points.find(point => point.netWorth >= amount) ?? null;
    if (reachedPoint) {
      const currentlyHeld = (latestPoint?.netWorth ?? 0) >= amount;
      return {
        ...base,
        status: currentlyHeld ? 'reached' as const : 'off-track' as const,
        monthLabel: reachedPoint.label,
        monthsAway: currentlyHeld ? 0 : null,
      };
    }

    if (!latestPoint) {
      return { ...base, status: 'unavailable' as const, monthLabel: null, monthsAway: null };
    }

    const remaining = amount - latestPoint.netWorth;
    const latestDate = new Date(latestPoint.year, latestPoint.month - 1, 1);

    if (monthlyGrowth !== null && monthlyGrowth > 0) {
      const monthsAway = Math.ceil(remaining / monthlyGrowth);
      if (Number.isFinite(monthsAway) && monthsAway > 0) {
        const projectedDate = addMonths(latestDate, monthsAway);

        if (targetDate) {
          const isOnTrack = projectedDate <= new Date(targetDate);
          return {
            ...base,
            status: isOnTrack ? 'on-track' as const : 'off-track' as const,
            monthLabel: format(projectedDate, 'MMM yyyy'),
            monthsAway,
          };
        }

        return { ...base, status: 'projected' as const, monthLabel: format(projectedDate, 'MMM yyyy'), monthsAway };
      }
    }

    if (targetDate) {
      return { ...base, status: 'off-track' as const, monthLabel: format(new Date(targetDate), 'MMM yyyy'), monthsAway: null };
    }

    return { ...base, status: 'unavailable' as const, monthLabel: null, monthsAway: null };
  });

  return {
    points,
    latestPoint,
    monthlyGrowth,
    milestones: milestoneRows,
  };
}

export function buildTimelineFeed(
  forecasted: DebtTimelineForecast[],
  customEvents: TimelineEvent[],
): TimelineFeedEntry[] {
  const debtEntries: TimelineDebtEntry[] = forecasted.map(forecast => ({
    kind: 'debt',
    forecast,
    date: forecast.projectedDate,
    dateLabel: forecast.projectedLabel,
  }));

  const customEntries: TimelineCustomEventEntry[] = customEvents.map(event => {
    const date = parseISO(event.eventDate);
    return {
      kind: 'custom',
      id: event.id,
      event,
      title: event.title,
      description: event.description,
      amount: event.amount,
      eventDate: event.eventDate,
      date,
      dateLabel: format(date, 'MMM yyyy'),
      type: event.type,
    };
  });

  return [...debtEntries, ...customEntries].sort((a, b) => {
    const dateDelta = a.date.getTime() - b.date.getTime();
    if (dateDelta !== 0) return dateDelta;
    if (a.kind !== b.kind) return a.kind === 'custom' ? -1 : 1;
    return a.kind === 'custom'
      ? a.title.localeCompare((b as TimelineCustomEventEntry).title)
      : a.forecast.name.localeCompare((b as TimelineDebtEntry).forecast.name);
  });
}

export function splitDateLabel(dateLabel: string): { month: string; year: string } {
  const parts = dateLabel.split(' ');
  return { month: parts[0] ?? '', year: parts[1] ?? '' };
}
