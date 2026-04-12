import { describe, expect, it } from 'vitest';
import { buildDebtTimelineModel } from '../utils';

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
});
