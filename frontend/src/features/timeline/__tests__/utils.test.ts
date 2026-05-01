import { describe, expect, it } from 'vitest';
import { buildDebtTimelineModel, buildNetWorthMilestoneModel, buildTimelineFeed, splitDateLabel } from '../utils';

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
        { id: 'l1', name: 'Car Loan', group: 'Car', type: 'Liability', order: 0, linkedBudgetCategoryId: 'd1' },
      ],
      values: [],
      budgetPlans: [
        { categoryId: 'd1', year: 2026, months: { 4: 300 } },
      ],
      debtCategories: [
        { id: 'd1', name: 'Car Loan Payment', type: 'Debt', group: 'Car', order: 0 },
      ],
    });

    expect(model.forecasted).toHaveLength(0);
    expect(model.unforecasted).toHaveLength(1);
    expect(model.unforecasted[0]).toMatchObject({
      name: 'Car Loan',
      reason: 'no-snapshot',
    });
  });
});

describe('buildNetWorthMilestoneModel', () => {
  it('marks a milestone as reached when net worth has crossed it', () => {
    const model = buildNetWorthMilestoneModel({
      items: [
        { id: 'a1', name: 'ISA', group: 'Savings', type: 'Asset', order: 0, linkedBudgetCategoryId: null },
      ],
      values: [
        { itemId: 'a1', year: 2024, months: { 1: 90_000, 6: 105_000, 12: 110_000 } },
      ],
      milestones: [{ id: '1', amount: 100_000, label: null, targetDate: null, note: '' }],
    });

    expect(model.milestones).toHaveLength(1);
    expect(model.milestones[0]).toMatchObject({
      status: 'reached',
      monthLabel: 'Jun 2024',
    });
  });

  it('projects a milestone when net worth trend is positive', () => {
    const model = buildNetWorthMilestoneModel({
      items: [
        { id: 'a1', name: 'ISA', group: 'Savings', type: 'Asset', order: 0, linkedBudgetCategoryId: null },
      ],
      values: [
        { itemId: 'a1', year: 2024, months: { 1: 80_000, 2: 82_000, 3: 84_000 } },
      ],
      milestones: [{ id: '1', amount: 100_000, label: null, targetDate: null, note: '' }],
    });

    expect(model.milestones[0].status).toBe('projected');
    expect(model.milestones[0].monthsAway).toBeGreaterThan(0);
  });
});

describe('buildTimelineFeed', () => {
  it('merges and sorts debt forecasts and custom events by date', () => {
    const forecasts = [
      {
        kind: 'forecast' as const,
        itemId: 'l1',
        name: 'Car Loan',
        group: 'Car',
        linkedCategoryName: 'Car Payment',
        snapshotMonth: 4,
        snapshotLabel: 'Apr 2026',
        currentBalance: 1200,
        monthlyPayment: 300,
        monthsToClose: 4,
        projectedDate: new Date('2026-08-01'),
        projectedLabel: 'Aug 2026',
      },
    ];
    const events = [
      {
        id: 'e1',
        title: 'Holiday fund',
        eventDate: '2026-06-01',
        type: 'Custom' as const,
        amount: 2000,
        description: '',
      },
    ];

    const feed = buildTimelineFeed(forecasts, events);

    expect(feed).toHaveLength(2);
    expect(feed[0].kind).toBe('custom');
    expect(feed[1].kind).toBe('debt');
  });

  it('places custom events before debt entries when dates are equal', () => {
    const forecasts = [
      {
        kind: 'forecast' as const,
        itemId: 'l1',
        name: 'Car Loan',
        group: 'Car',
        linkedCategoryName: null,
        snapshotMonth: 8,
        snapshotLabel: 'Aug 2026',
        currentBalance: 1200,
        monthlyPayment: 300,
        monthsToClose: 0,
        projectedDate: new Date('2026-08-01'),
        projectedLabel: 'Aug 2026',
      },
    ];
    const events = [
      {
        id: 'e1',
        title: 'Bonus received',
        eventDate: '2026-08-01',
        type: 'Custom' as const,
        amount: null,
        description: '',
      },
    ];

    const feed = buildTimelineFeed(forecasts, events);
    expect(feed[0].kind).toBe('custom');
  });
});

describe('splitDateLabel', () => {
  it('splits "Oct 2025" into month "Oct" and year "2025"', () => {
    expect(splitDateLabel('Oct 2025')).toEqual({ month: 'Oct', year: '2025' });
  });

  it('splits "Jan 2030" correctly', () => {
    expect(splitDateLabel('Jan 2030')).toEqual({ month: 'Jan', year: '2030' });
  });

  it('returns empty strings for a malformed label', () => {
    expect(splitDateLabel('')).toEqual({ month: '', year: '' });
  });
});
