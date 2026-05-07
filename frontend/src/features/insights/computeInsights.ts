import type { Insight, InsightsInput } from './types';
import { computeWantsNeedsSplit } from './computeWantsNeedsSplit';
import { classifyBudgetHealth } from './classifyBudgetHealth';

const TYPE_PRIORITY: Record<Insight['type'], number> = { warning: 0, info: 1, positive: 2 };

function fmt(amount: number): string {
  return `£${Math.round(amount).toLocaleString('en-GB')}`;
}

export function computeInsights(input: InsightsInput): Insight[] {
  const { transactions, budgetPlans, categories, engagement, netWorthItems, netWorthValues, today } = input;

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const avgDailySpend = engagement.insights.avgDailySpend;

  // ── Featured insight ────────────────────────────────────────────────────────
  const expenseCategories = categories.filter(c => c.type === 'Expenses');
  const expenseBudget = expenseCategories.reduce((sum, cat) => {
    const plan = budgetPlans.find(p => p.categoryId === cat.id);
    return sum + (plan?.months[month] ?? 0);
  }, 0);

  if (expenseBudget === 0) return [];

  const projectedSpend = avgDailySpend * daysInMonth;
  const diff = expenseBudget - projectedSpend;
  const isOverspending = diff < 0;

  const dailyBudget = expenseBudget / daysInMonth;
  const pctFaster = dailyBudget > 0
    ? Math.round(((avgDailySpend - dailyBudget) / dailyBudget) * 100)
    : 0;

  const spendingPace: Insight = {
    id: 'featured',
    type: isOverspending ? 'warning' : 'positive',
    headline: isOverspending ? "You're going too fast" : "You're on track",
    value: isOverspending ? `${fmt(Math.abs(diff))} over budget` : `${fmt(diff)} under budget`,
    subtext: isOverspending
      ? `You're spending ${pctFaster}% faster than your plan`
      : 'Spending matches your plan',
    actionLabel: isOverspending ? `Stay under ${fmt(dailyBudget)} today` : 'Keep this pace',
  };

  // ── Secondary insights ──────────────────────────────────────────────────────
  const secondary: Insight[] = [];

  // A. Over-budget categories (aggregated)
  const overBudgetCats = engagement.tasks.overBudgetCategories;
  if (overBudgetCats.length > 0) {
    const totalOver = overBudgetCats.reduce((sum, c) => sum + c.overspend, 0);
    secondary.push({
      id: 'over-budget',
      type: 'warning',
      headline: 'Over budget categories',
      value: `${fmt(totalOver)} over`,
      subtext: overBudgetCats.map(c => c.name).join(', '),
      actionLabel: 'Review spending',
    });
  }

  // B. Savings rate
  const currentMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  const totalIncome = currentMonthTx
    .filter(tx => tx.budgetType === 'Income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalSavings = currentMonthTx
    .filter(tx => tx.budgetType === 'Savings')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (totalIncome > 0 && totalSavings > 0) {
    const rate = Math.round((totalSavings / totalIncome) * 100);
    const isLow = rate < 20;
    secondary.push({
      id: 'savings-rate',
      type: 'info',
      headline: 'Savings rate',
      value: `${rate}%`,
      subtext: isLow ? 'Below target' : 'Strong habit',
      actionLabel: isLow ? 'Increase savings' : 'Keep it up',
    });
  }

  // C. No-spend streak
  const streak = engagement.streak.noSpend.currentStreak;
  if (streak >= 2 && avgDailySpend > 0) {
    const estimatedSaved = Math.round(avgDailySpend * streak);
    secondary.push({
      id: 'no-spend-streak',
      type: 'positive',
      headline: 'No-spend streak',
      value: `${streak} days`,
      subtext: `~${fmt(estimatedSaved)} not spent`,
      actionLabel: 'Keep it going',
    });
  }

  // D. Net worth growth
  if (netWorthItems.length > 0) {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;

    const hasCurrentData = netWorthValues.some(v => v.year === year && v.months[month] !== undefined);
    const hasPrevData = netWorthValues.some(v => v.year === prevYear && v.months[prevMonth] !== undefined);

    if (hasCurrentData && hasPrevData) {
      const computeNW = (y: number, m: number) =>
        netWorthItems.reduce((total, item) => {
          const val = netWorthValues.find(v => v.itemId === item.id && v.year === y);
          const amount = val?.months[m] ?? 0;
          return total + (item.type === 'Asset' ? amount : -amount);
        }, 0);

      const growth = computeNW(year, month) - computeNW(prevYear, prevMonth);
      secondary.push({
        id: 'net-worth-growth',
        type: growth >= 0 ? 'positive' : 'warning',
        headline: 'Net worth growth',
        value: `${growth >= 0 ? '+' : '-'}${fmt(Math.abs(growth))}`,
        subtext: growth >= 0 ? "You're growing your net worth" : 'Net worth dropped this month',
      });
    }
  }

  // E. Wants/Needs insights
  const prevMonthTx = input.previousMonthTransactions ?? [];

  const incomeCategories = categories.filter(c => c.type === 'Income');
  const budgetedIncome = incomeCategories.reduce((sum, cat) => {
    const plan = budgetPlans.find(p => p.categoryId === cat.id);
    return sum + (plan?.months[month] ?? 0);
  }, 0);

  const split = computeWantsNeedsSplit(currentMonthTx, categories, budgetedIncome || undefined);

  let featured: Insight | null = null;

  if ((budgetedIncome > 0 || split.incomeAmount > 0) && (split.wantsAmount > 0 || split.needsAmount > 0)) {
    const base = budgetedIncome || split.incomeAmount;
    const savingsPct = base > 0 ? Math.round((totalSavings / base) * 100) : 0;
    const debtPct = base > 0
      ? Math.round((currentMonthTx.filter(tx => tx.budgetType === 'Debt').reduce((s, tx) => s + Math.abs(tx.amount), 0) / base) * 100)
      : 0;

    const health = classifyBudgetHealth({ needsPct: split.needsPct, wantsPct: split.wantsPct, savingsPct, debtPct });

    const prevSplit = prevMonthTx.length > 0 ? computeWantsNeedsSplit(prevMonthTx, categories) : null;
    const wantsTrend = prevSplit && prevSplit.wantsAmount > 0
      ? ((split.wantsAmount - prevSplit.wantsAmount) / prevSplit.wantsAmount) * 100
      : null;

    const allocatedPct = split.needsPct + split.wantsPct + savingsPct;
    const surplusPct = Math.max(0, 100 - allocatedPct);

    const points: import('./types').InsightPoint[] = [];

    if (split.needsPct <= 50) {
      points.push({ text: `Needs at ${split.needsPct}% — within the 50% limit`, positive: true });
    } else {
      points.push({ text: `Needs at ${split.needsPct}% — over the 50% limit`, positive: false });
    }

    if (debtPct > 0) {
      points.push({ text: 'Actively paying down debt', positive: true });
    }

    if (split.wantsPct <= 30) {
      points.push({ text: `Wants at ${split.wantsPct}% — within the 30% limit`, positive: true });
    } else {
      points.push({ text: `Wants at ${split.wantsPct}% — over the 30% limit`, positive: false });
    }

    if (savingsPct >= 20) {
      points.push({ text: `Saving ${savingsPct}% — hitting the 20% goal`, positive: true });
    } else if (savingsPct > 0) {
      points.push({ text: `Saving ${savingsPct}% — short of the 20% goal`, positive: false });
    } else {
      points.push({ text: 'No savings this month', positive: false });
    }

    if (wantsTrend !== null && wantsTrend > 10) {
      points.push({ text: `Wants up ${Math.round(wantsTrend)}% vs last month`, positive: false });
    } else if (wantsTrend !== null && wantsTrend <= 0) {
      points.push({ text: 'Wants down vs last month', positive: true });
    }

    if (surplusPct > 0) {
      points.push({ text: `${surplusPct}% of income not allocated`, positive: false });
    }

    featured = {
      id: 'wants-needs-split',
      type: health.type,
      headline: health.statusLabel,
      value: `${split.needsPct}% Needs · ${split.wantsPct}% Wants · ${savingsPct}% Savings`,
      stats: (() => {
        const base = [
          { label: 'Needs',   value: `${split.needsPct}%`, numericValue: split.needsPct, target: '≤50%', color: 'bg-blue-400',    status: split.needsPct <= 50 ? 'good' as const : 'bad' as const },
          { label: 'Wants',   value: `${split.wantsPct}%`, numericValue: split.wantsPct, target: '≤30%', color: 'bg-amber-400',   status: split.wantsPct <= 30 ? 'good' as const : 'bad' as const },
          { label: 'Savings', value: `${savingsPct}%`,     numericValue: savingsPct,     target: '≥20%', color: 'bg-emerald-400', status: savingsPct >= 20    ? 'good' as const : 'bad' as const },
        ];
        if (surplusPct > 0) {
          base.push({ label: 'Not Allocated', value: `${surplusPct}%`, numericValue: surplusPct, target: '', color: 'bg-slate-300', status: 'bad' as const });
        }
        return base;
      })(),
      points,
      subtext: health.subtext,
      statusLabel: '50/30/20',
      actionLabel: health.actionLabel,
      featured: true,
    };
    secondary.push(spendingPace);

    if (split.wantsPct > 30) {
      secondary.push({
        id: 'wants-over-budget',
        type: 'warning',
        headline: 'Wants too high',
        value: `${split.wantsPct}%`,
        subtext: 'Target is ≤30%',
        actionLabel: 'Reduce Wants',
      });
    }

    if (prevSplit && prevSplit.wantsAmount > 0 && wantsTrend !== null && wantsTrend > 10) {
      secondary.push({
        id: 'wants-trend',
        type: 'warning',
        headline: 'Wants are increasing',
        value: `+${Math.round(wantsTrend)}%`,
        subtext: `${fmt(split.wantsAmount)} this month vs ${fmt(prevSplit.wantsAmount)} last month`,
        actionLabel: 'Review Wants',
      });
    }
  }

  secondary.sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]);

  const featuredInsight = featured ?? { ...spendingPace, featured: true };
  return [featuredInsight, ...secondary.slice(0, 4)];
}
