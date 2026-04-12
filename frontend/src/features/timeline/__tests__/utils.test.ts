import { describe, expect, it } from 'vitest';
import { buildDebtTimelineModel, buildNetWorthMilestoneModel, buildTimelineFeed } from '../utils';

describe('buildDebtTimelineModel', () => {
  it('builds forecasts, closed debts, and unforecasted debts from linked liabilities', () => {
    const model = buildDebtTimelineModel({
      year: 2026,
      monthLimit: 4,
      items: [
        { id: 'l1', name: 'Car Loan', group: 'Car', type: 'Liability', order: 0, linkedBudgetCategoryId: 'd1' },
        { id: 'l2', name: 'Credit Card', group: 'Cards', type: 'Liability', order: 1, linkedBudgetCategoryId: null },
        { id: 'l3', name: 'Old Loan', group: 'Closed', type: 'Liability', order: 2, linkedBudgetCategoryId: 'd2' },
      ],
      values: [
        { itemId: 'l1', year: 2026, months: { 4: 1200 } },
        { itemId: 'l2', year: 2026, months: { 4: 800 } },
        { itemId: 'l3', year: 2026, months: { 4: 0 } },
      ],
      budgetPlans: [
        { categoryId: 'd1', year: 2026, months: { 4: 300 } },
        { categoryId: 'd2', year: 2026, months: { 4: 100 } },
      ],
      debtCategories: [
        { id: 'd1', name: 'Car Loan Payment', type: 'Debt', group: 'Car', order: 0 },
        { id: 'd2', name: 'Old Loan Payment', type: 'Debt', group: 'Closed', order: 1 },
      ],
    });

    expect(model.forecasted).toHaveLength(1);
    expect(model.forecasted[0]).toMatchObject({
      name: 'Car Loan',
      linkedCategoryName: 'Car Loan Payment',
      monthlyPayment: 300,
      monthsToClose: 4,
      projectedLabel: 'Aug 2026',
    });

    expect(model.closed).toHaveLength(1);
    expect(model.closed[0].name).toBe('Old Loan');

    expect(model.unforecasted).toHaveLength(1);
    expect(model.unforecasted[0]).toMatchObject({
      name: 'Credit Card',
      reason: 'unlinked',
      currentBalance: 800,
    });

    expect(model.summary).toMatchObject({
      activeDebtCount: 2,
      forecastableCount: 1,
      totalActiveBalance: 2000,
      totalMonthlyPayment: 300,
    });
  });

  it('marks debts without snapshots or payments as unforecasted', () => {
    const model = buildDebtTimelineModel({
      year: 2026,
      monthLimit: 4,
      items: [
        { id: 'l1', name: 'Mortgage', group: 'Home', type: 'Liability', order: 0, linkedBudgetCategoryId: 'd1' },
        { id: 'l2', name: 'Personal Loan', group: 'Loan', type: 'Liability', order: 1, linkedBudgetCategoryId: 'd2' },
      ],
      values: [
        { itemId: 'l1', year: 2026, months: {} },
        { itemId: 'l2', year: 2026, months: { 3: 950 } },
      ],
      budgetPlans: [
        { categoryId: 'd2', year: 2026, months: { 1: 0, 2: 0, 3: 0 } },
      ],
      debtCategories: [
        { id: 'd1', name: 'Mortgage Payment', type: 'Debt', group: 'Home', order: 0 },
        { id: 'd2', name: 'Personal Loan Payment', type: 'Debt', group: 'Loan', order: 1 },
      ],
    });

    expect(model.forecasted).toHaveLength(0);
    expect(model.unforecasted).toEqual([
      expect.objectContaining({ name: 'Mortgage', reason: 'no-snapshot' }),
      expect.objectContaining({ name: 'Personal Loan', reason: 'no-payment', snapshotLabel: 'Mar 2026' }),
    ]);
  });

  it('merges one-time custom events with debt payoffs in date order', () => {
    const model = buildDebtTimelineModel({
      year: 2026,
      monthLimit: 4,
      items: [
        { id: 'l1', name: 'Car Loan', group: 'Car', type: 'Liability', order: 0, linkedBudgetCategoryId: 'd1' },
      ],
      values: [
        { itemId: 'l1', year: 2026, months: { 4: 1200 } },
      ],
      budgetPlans: [
        { categoryId: 'd1', year: 2026, months: { 4: 300 } },
      ],
      debtCategories: [
        { id: 'd1', name: 'Car Loan Payment', type: 'Debt', group: 'Car', order: 0 },
      ],
    });

    const feed = buildTimelineFeed(model.forecasted, [
      {
        id: 'event-1',
        title: 'SAYE maturity',
        eventDate: '2026-07-15',
        type: 'Custom',
        amount: 5000,
        description: 'Shares become available',
      },
      {
        id: 'event-2',
        title: 'Bonus',
        eventDate: '2026-09-01',
        type: 'Custom',
        amount: null,
        description: '',
      },
    ]);

    expect(feed).toHaveLength(3);
    expect(feed.map(entry => entry.kind === 'custom' ? entry.title : entry.forecast.name)).toEqual([
      'SAYE maturity',
      'Car Loan',
      'Bonus',
    ]);
    expect(feed[0]).toMatchObject({
      kind: 'custom',
      title: 'SAYE maturity',
      eventDate: '2026-07-15',
    });
    expect(feed[1]).toMatchObject({
      kind: 'debt',
      forecast: expect.objectContaining({
        name: 'Car Loan',
        projectedLabel: 'Aug 2026',
      }),
    });
  });

  it('builds net worth milestones from saved history and projects unreached targets', () => {
    const model = buildNetWorthMilestoneModel({
      items: [
        { id: 'a1', name: 'Cash', group: 'Cash', type: 'Asset', order: 0 },
        { id: 'l1', name: 'Loan', group: 'Debt', type: 'Liability', order: 1 },
      ],
      values: [
        { itemId: 'a1', year: 2025, months: { 11: 90000, 12: 98000 } },
        { itemId: 'a1', year: 2026, months: { 1: 105000, 2: 112000, 3: 119000 } },
        { itemId: 'l1', year: 2025, months: { 11: 5000, 12: 3000 } },
        { itemId: 'l1', year: 2026, months: { 1: 2000, 2: 1000, 3: 0 } },
      ],
      milestones: [100000, 200000, 1000000],
    });

    expect(model.latestPoint).toMatchObject({
      label: 'Mar 2026',
      netWorth: 119000,
    });
    expect(model.monthlyGrowth).toBe(8000);
    expect(model.milestones).toEqual([
      expect.objectContaining({
        amount: 100000,
        status: 'reached',
        monthLabel: 'Jan 2026',
      }),
      expect.objectContaining({
        amount: 200000,
        status: 'projected',
        monthLabel: 'Feb 2027',
        monthsAway: 11,
      }),
      expect.objectContaining({
        amount: 1000000,
        status: 'projected',
      }),
    ]);
  });

  it('marks milestones as unavailable when recent trend is not positive', () => {
    const model = buildNetWorthMilestoneModel({
      items: [
        { id: 'a1', name: 'Cash', group: 'Cash', type: 'Asset', order: 0 },
      ],
      values: [
        { itemId: 'a1', year: 2026, months: { 1: 95000, 2: 94000, 3: 93000 } },
      ],
      milestones: [100000],
    });

    expect(model.monthlyGrowth).toBe(-1000);
    expect(model.milestones[0]).toMatchObject({
      amount: 100000,
      status: 'unavailable',
      monthLabel: null,
    });
  });

  it('marks previously reached milestones as off-track and uses a longer trend window for future projections', () => {
    const model = buildNetWorthMilestoneModel({
      items: [
        { id: 'a1', name: 'Cash', group: 'Cash', type: 'Asset', order: 0 },
      ],
      values: [
        { itemId: 'a1', year: 2026, months: { 1: 50000, 2: 60000, 3: 70000, 4: 80000, 5: 90000, 6: 100000, 7: 95000, 8: 95000, 9: 95000, 10: 95000 } },
      ],
      milestones: [100000, 200000],
    });

    expect(model.monthlyGrowth).toBe(10000);
    expect(model.milestones).toEqual([
      expect.objectContaining({
        amount: 100000,
        status: 'off-track',
        monthLabel: 'Jun 2026',
        monthsAway: null,
      }),
      expect.objectContaining({
        amount: 200000,
        status: 'projected',
        monthLabel: 'Sep 2027',
        monthsAway: 11,
      }),
    ]);
  });
});
