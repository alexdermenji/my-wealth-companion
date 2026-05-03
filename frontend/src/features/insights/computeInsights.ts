import type { Insight, InsightsInput } from './types';

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

  const featured: Insight = {
    id: 'featured',
    type: isOverspending ? 'warning' : 'positive',
    headline: isOverspending ? "You're on track to overspend" : "You're on track this month",
    value: isOverspending ? `${fmt(Math.abs(diff))} over budget` : `${fmt(diff)} under budget`,
    subtext: isOverspending
      ? `Spending ${pctFaster}% faster than your monthly pace`
      : 'Spending aligned with your plan',
    actionLabel: isOverspending ? 'Slow down spending today' : 'Keep this pace',
    featured: true,
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
      headline: 'Categories over budget',
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
      subtext: isLow ? 'Below recommended level' : 'Strong savings habit',
      actionLabel: isLow ? 'Increase savings this month' : 'Keep it up',
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
      value: `~${fmt(estimatedSaved)} saved`,
      subtext: `${streak} days without spending`,
      actionLabel: 'Continue streak',
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
        subtext: growth >= 0 ? 'Up from last month' : 'Down from last month',
      });
    }
  }

  secondary.sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]);

  return [featured, ...secondary.slice(0, 4)];
}
