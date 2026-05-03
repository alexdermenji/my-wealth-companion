import type { Insight, InsightsInput } from './types';

function fmt(n: number) {
  return `£${Math.round(n).toLocaleString('en-GB')}`;
}

export function computeTips(input: InsightsInput, presentIds: Set<string>): Insight[] {
  const tips: Insight[] = [];
  const { transactions, engagement, netWorthItems, today } = input;

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const avgDailySpend = engagement.insights.avgDailySpend;

  // ── Savings rate tip ────────────────────────────────────────────────────────
  if (!presentIds.has('savings-rate')) {
    const monthTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const totalIncome  = monthTx.filter(tx => tx.budgetType === 'Income').reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const totalSavings = monthTx.filter(tx => tx.budgetType === 'Savings').reduce((s, tx) => s + Math.abs(tx.amount), 0);

    if (totalIncome > 0 && totalSavings === 0) {
      const target = Math.round(totalIncome * 0.05);
      tips.push({
        id: 'tip-savings-rate',
        type: 'info',
        headline: 'Start saving this month',
        value: '0% saved so far',
        subtext: `You've tracked ${fmt(totalIncome)} income but no savings yet. Even ${fmt(target)} (5%) makes a difference.`,
        actionLabel: 'Log a saving',
        isTip: true,
      });
    } else {
      tips.push({
        id: 'tip-savings-rate',
        type: 'info',
        headline: 'Track your savings rate',
        value: 'Aim for 20%',
        subtext: 'Log income and savings this month to see your rate.',
        actionLabel: 'Add income',
        isTip: true,
      });
    }
  }

  // ── No-spend streak tip ─────────────────────────────────────────────────────
  if (!presentIds.has('no-spend-streak')) {
    const { currentStreak, todayStatus } = engagement.streak.noSpend;

    if (currentStreak === 1) {
      tips.push({
        id: 'tip-no-spend',
        type: 'info',
        headline: 'One more day to go',
        value: '1-day streak',
        subtext: `Avoid spending today and you'll hit a 2-day streak — saving ~${fmt(avgDailySpend)}.`,
        actionLabel: 'Keep it going',
        isTip: true,
      });
    } else if (todayStatus === 'no-spend') {
      tips.push({
        id: 'tip-no-spend',
        type: 'info',
        headline: 'Good start today',
        value: 'No spend today',
        subtext: 'Do the same tomorrow to start a no-spend streak.',
        actionLabel: 'Keep it going',
        isTip: true,
      });
    } else {
      tips.push({
        id: 'tip-no-spend',
        type: 'info',
        headline: 'Try a no-spend day',
        value: '2 days = streak',
        subtext: 'Two consecutive days without spending starts a streak.',
        actionLabel: 'Start today',
        isTip: true,
      });
    }
  }

  // ── Net worth tip ───────────────────────────────────────────────────────────
  if (!presentIds.has('net-worth-growth')) {
    tips.push(
      netWorthItems.length === 0
        ? {
            id: 'tip-net-worth',
            type: 'info',
            headline: 'Track your net worth',
            value: 'See your growth',
            subtext: 'Add assets and liabilities to see your full financial picture.',
            actionLabel: 'Go to net worth',
            isTip: true,
          }
        : {
            id: 'tip-net-worth',
            type: 'info',
            headline: 'Log this month\'s net worth',
            value: 'Keep it updated',
            subtext: 'Monthly entries let you track how your net worth grows over time.',
            actionLabel: 'Update now',
            isTip: true,
          }
    );
  }

  // ── Categories tip ──────────────────────────────────────────────────────────
  if (!presentIds.has('over-budget')) {
    tips.push({
      id: 'tip-categories',
      type: 'info',
      headline: 'All categories on track',
      value: 'No overspend',
      subtext: 'Check your category budgets weekly to stay ahead of any creep.',
      actionLabel: 'Go to budget',
      isTip: true,
    });
  }

  return tips;
}
