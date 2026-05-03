import { describe, it, expect } from 'vitest';
import { computeInsights } from '../computeInsights';
import type { InsightsInput } from '../types';
import type { EngagementSummary } from '@/features/engagement/types';

const TODAY = new Date('2026-05-03');
const YEAR = 2026;
const MONTH = 5;

const baseEngagement: EngagementSummary = {
  streak: {
    tracking: { currentStreak: 1, longestStreak: 5, todayStatus: 'logged', recentDays: [] },
    noSpend:  { currentStreak: 0, longestStreak: 3, todayStatus: 'spent' },
  },
  tasks: {
    daysSinceLastTransaction: 0,
    overBudgetCategories: [],
    nextMonthBudgetFilled: true,
    currentMonthNetWorthFilled: true,
  },
  insights: { weeklyTrackedTotal: 350, avgDailySpend: 40 },
};

const baseInput: InsightsInput = {
  transactions: [],
  budgetPlans: [{ categoryId: 'cat-1', year: YEAR, months: { [MONTH]: 2000 } }],
  categories: [{ id: 'cat-1', name: 'Groceries', type: 'Expenses', group: 'Food', order: 1 }],
  engagement: baseEngagement,
  netWorthItems: [],
  netWorthValues: [],
  today: TODAY,
};

// avgDailySpend=40, daysInMonth=31 → projected=1240, budget=2000 → £760 under
describe('computeInsights — featured insight', () => {
  it('returns positive featured when under budget', () => {
    const [featured] = computeInsights(baseInput);
    expect(featured.featured).toBe(true);
    expect(featured.type).toBe('positive');
    expect(featured.headline).toBe("You're on track this month");
    expect(featured.value).toContain('under budget');
    expect(featured.actionLabel).toBe('Keep this pace');
  });

  it('returns warning featured when overspending', () => {
    // avgDailySpend=80, daysInMonth=31 → projected=2480 > budget=2000
    const input: InsightsInput = {
      ...baseInput,
      engagement: { ...baseEngagement, insights: { weeklyTrackedTotal: 560, avgDailySpend: 80 } },
    };
    const [featured] = computeInsights(input);
    expect(featured.type).toBe('warning');
    expect(featured.headline).toBe("You're on track to overspend");
    expect(featured.value).toContain('over budget');
    expect(featured.actionLabel).toBe('Slow down spending today');
  });

  it('returns empty array when expenseBudget is 0', () => {
    const input: InsightsInput = {
      ...baseInput,
      budgetPlans: [],
    };
    expect(computeInsights(input)).toHaveLength(0);
  });

  it('returns empty array when no Expenses categories', () => {
    const input: InsightsInput = {
      ...baseInput,
      categories: [{ id: 'cat-1', name: 'Salary', type: 'Income', group: 'Work', order: 1 }],
    };
    expect(computeInsights(input)).toHaveLength(0);
  });
});

describe('computeInsights — over-budget categories', () => {
  const withOverBudget: InsightsInput = {
    ...baseInput,
    engagement: {
      ...baseEngagement,
      tasks: {
        ...baseEngagement.tasks,
        overBudgetCategories: [
          { name: 'Groceries', overspend: 60 },
          { name: 'Transport', overspend: 34 },
        ],
      },
    },
  };

  it('shows single aggregated card for multiple over-budget categories', () => {
    const insights = computeInsights(withOverBudget);
    const card = insights.find(i => i.id === 'over-budget');
    expect(card).toBeDefined();
    expect(card!.subtext).toContain('Groceries');
    expect(card!.subtext).toContain('Transport');
  });

  it('aggregates total overspend correctly', () => {
    const insights = computeInsights(withOverBudget);
    const card = insights.find(i => i.id === 'over-budget')!;
    expect(card.value).toContain('94');
  });

  it('does not show over-budget card when no categories are over', () => {
    const insights = computeInsights(baseInput);
    expect(insights.find(i => i.id === 'over-budget')).toBeUndefined();
  });
});

describe('computeInsights — savings rate', () => {
  const withSavings = (income: number, savings: number): InsightsInput => ({
    ...baseInput,
    transactions: [
      { id: '1', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-10`, amount: income,  details: '', accountId: 'a1', budgetType: 'Income',  budgetPositionId: '' },
      { id: '2', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-15`, amount: savings, details: '', accountId: 'a1', budgetType: 'Savings', budgetPositionId: '' },
    ],
  });

  it('shows savings rate card when income > 0 and savings > 0', () => {
    const insights = computeInsights(withSavings(3000, 600));
    expect(insights.find(i => i.id === 'savings-rate')).toBeDefined();
  });

  it('shows "Below recommended level" when rate < 20%', () => {
    const insights = computeInsights(withSavings(3000, 300)); // 10%
    const card = insights.find(i => i.id === 'savings-rate')!;
    expect(card.value).toBe('10%');
    expect(card.subtext).toBe('Below recommended level');
    expect(card.actionLabel).toBe('Increase savings this month');
  });

  it('shows "Strong savings habit" when rate >= 20%', () => {
    const insights = computeInsights(withSavings(3000, 900)); // 30%
    const card = insights.find(i => i.id === 'savings-rate')!;
    expect(card.value).toBe('30%');
    expect(card.subtext).toBe('Strong savings habit');
    expect(card.actionLabel).toBe('Keep it up');
  });

  it('suppresses savings rate card when income is 0', () => {
    const input: InsightsInput = {
      ...baseInput,
      transactions: [
        { id: '1', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-15`, amount: 500, details: '', accountId: 'a1', budgetType: 'Savings', budgetPositionId: '' },
      ],
    };
    expect(computeInsights(input).find(i => i.id === 'savings-rate')).toBeUndefined();
  });

  it('suppresses savings rate card when savings is 0', () => {
    const input: InsightsInput = {
      ...baseInput,
      transactions: [
        { id: '1', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-10`, amount: 3000, details: '', accountId: 'a1', budgetType: 'Income', budgetPositionId: '' },
      ],
    };
    expect(computeInsights(input).find(i => i.id === 'savings-rate')).toBeUndefined();
  });

  it('ignores transactions from other months', () => {
    const input: InsightsInput = {
      ...baseInput,
      transactions: [
        { id: '1', date: `${YEAR}-04-10`, amount: 3000, details: '', accountId: 'a1', budgetType: 'Income',  budgetPositionId: '' },
        { id: '2', date: `${YEAR}-04-15`, amount: 900,  details: '', accountId: 'a1', budgetType: 'Savings', budgetPositionId: '' },
      ],
    };
    expect(computeInsights(input).find(i => i.id === 'savings-rate')).toBeUndefined();
  });
});

describe('computeInsights — no-spend streak', () => {
  const withStreak = (streak: number): InsightsInput => ({
    ...baseInput,
    engagement: {
      ...baseEngagement,
      streak: {
        ...baseEngagement.streak,
        noSpend: { currentStreak: streak, longestStreak: streak, todayStatus: 'no-spend' },
      },
    },
  });

  it('shows streak card when streak >= 2', () => {
    const insights = computeInsights(withStreak(3));
    const card = insights.find(i => i.id === 'no-spend-streak');
    expect(card).toBeDefined();
    expect(card!.value).toMatch(/^~£/);
    expect(card!.subtext).toBe('3 days without spending');
    expect(card!.actionLabel).toBe('Continue streak');
  });

  it('streak value starts with "~£"', () => {
    const card = computeInsights(withStreak(4)).find(i => i.id === 'no-spend-streak')!;
    expect(card.value.startsWith('~£')).toBe(true);
  });

  it('suppresses streak card when streak < 2', () => {
    expect(computeInsights(withStreak(1)).find(i => i.id === 'no-spend-streak')).toBeUndefined();
    expect(computeInsights(withStreak(0)).find(i => i.id === 'no-spend-streak')).toBeUndefined();
  });
});

describe('computeInsights — net worth growth', () => {
  const asset = { id: 'nwi-1', name: 'Savings Account', group: 'Cash', type: 'Asset' as const, order: 1 };

  it('shows net worth card when both current and previous month have data', () => {
    const input: InsightsInput = {
      ...baseInput,
      netWorthItems: [asset],
      netWorthValues: [
        { itemId: 'nwi-1', year: YEAR, months: { [MONTH]: 15000, [MONTH - 1]: 14000 } },
      ],
    };
    const card = computeInsights(input).find(i => i.id === 'net-worth-growth');
    expect(card).toBeDefined();
    expect(card!.value).toBe('+£1,000');
    expect(card!.subtext).toBe('Up from last month');
  });

  it('suppresses net worth card when previous month has no data', () => {
    const input: InsightsInput = {
      ...baseInput,
      netWorthItems: [asset],
      netWorthValues: [
        { itemId: 'nwi-1', year: YEAR, months: { [MONTH]: 15000 } },
      ],
    };
    expect(computeInsights(input).find(i => i.id === 'net-worth-growth')).toBeUndefined();
  });

  it('suppresses net worth card when netWorthItems is empty', () => {
    const input: InsightsInput = {
      ...baseInput,
      netWorthItems: [],
      netWorthValues: [{ itemId: 'nwi-1', year: YEAR, months: { [MONTH]: 15000, [MONTH - 1]: 14000 } }],
    };
    expect(computeInsights(input).find(i => i.id === 'net-worth-growth')).toBeUndefined();
  });

  it('shows negative growth with warning type', () => {
    const input: InsightsInput = {
      ...baseInput,
      netWorthItems: [asset],
      netWorthValues: [
        { itemId: 'nwi-1', year: YEAR, months: { [MONTH]: 13000, [MONTH - 1]: 14000 } },
      ],
    };
    const card = computeInsights(input).find(i => i.id === 'net-worth-growth')!;
    expect(card.type).toBe('warning');
    expect(card.subtext).toBe('Down from last month');
  });
});

describe('computeInsights — ordering and limits', () => {
  it('featured insight is always first', () => {
    const insights = computeInsights(baseInput);
    expect(insights[0].featured).toBe(true);
  });

  it('warnings appear before positive in secondary insights', () => {
    const input: InsightsInput = {
      ...baseInput,
      engagement: {
        ...baseEngagement,
        streak: { ...baseEngagement.streak, noSpend: { currentStreak: 3, longestStreak: 3, todayStatus: 'no-spend' } },
        tasks: { ...baseEngagement.tasks, overBudgetCategories: [{ name: 'Groceries', overspend: 50 }] },
      },
      transactions: [
        { id: '1', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-10`, amount: 3000, details: '', accountId: 'a1', budgetType: 'Income',  budgetPositionId: '' },
        { id: '2', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-15`, amount: 300,  details: '', accountId: 'a1', budgetType: 'Savings', budgetPositionId: '' },
      ],
    };
    const secondary = computeInsights(input).filter(i => !i.featured);
    const firstNonPositive = secondary.findIndex(i => i.type !== 'warning');
    const firstPositive = secondary.findIndex(i => i.type === 'positive');
    if (firstNonPositive !== -1 && firstPositive !== -1) {
      expect(firstPositive).toBeGreaterThan(firstNonPositive);
    }
  });

  it('never returns more than 5 insights', () => {
    const input: InsightsInput = {
      ...baseInput,
      engagement: {
        ...baseEngagement,
        streak: { ...baseEngagement.streak, noSpend: { currentStreak: 5, longestStreak: 5, todayStatus: 'no-spend' } },
        tasks: { ...baseEngagement.tasks, overBudgetCategories: [{ name: 'Dining', overspend: 80 }] },
      },
      transactions: [
        { id: '1', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-10`, amount: 3000, details: '', accountId: 'a1', budgetType: 'Income',  budgetPositionId: '' },
        { id: '2', date: `${YEAR}-${String(MONTH).padStart(2,'0')}-15`, amount: 900,  details: '', accountId: 'a1', budgetType: 'Savings', budgetPositionId: '' },
      ],
      netWorthItems: [{ id: 'nwi-1', name: 'Savings', group: 'Cash', type: 'Asset', order: 1 }],
      netWorthValues: [{ itemId: 'nwi-1', year: YEAR, months: { [MONTH]: 15000, [MONTH - 1]: 14000 } }],
    };
    expect(computeInsights(input).length).toBeLessThanOrEqual(5);
  });

  it('returns empty array for a new user with no budget set', () => {
    const input: InsightsInput = { ...baseInput, budgetPlans: [] };
    expect(computeInsights(input)).toHaveLength(0);
  });
});
