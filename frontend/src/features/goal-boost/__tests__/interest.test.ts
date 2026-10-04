import { describe, expect, it } from 'vitest';
import {
  goalInterest,
  interestSummary,
  validateDebtSettings,
  type DebtSettings,
} from '../interest';
import { comparePayoff, type BoostEntry, type BoostGoal } from '../model';
const settings: DebtSettings = {
  version: 2,
  balance: 1000,
  rate: 12,
  payment: 510,
  debtType: 'loan',
  balanceDate: '2026-01-01',
  nextPaymentDate: '2026-02-01',
};
const goal: BoostGoal = {
  id: 'goal',
  category_id: 'debt',
  active: true,
  name: 'Loan',
  kind: 'Debt',
  settings,
};
const entry = (
  id: string,
  amount: number,
  date = '2026-01-02',
  goal_id = 'goal',
) => ({ id, amount, date, goal_id, kind: 'contribution' }) as BoostEntry;
describe('contribution interest savings', () => {
  it('includes existing payments once settings are supplied, without mutating cash entries', () => {
    const entries = [entry('old', 4)];
    const copy = JSON.stringify(entries);
    expect(
      goalInterest({ ...goal, settings: {} }, entries).error,
    ).toBeTruthy();
    const result = goalInterest(goal, entries);
    expect(result.saved).toBe(0.08);
    expect(result.byEntry.old).toBe(result.saved);
    expect(JSON.stringify(entries)).toBe(copy);
  });
  it('compounds on the reduced balance, so cumulative savings equal a combined extra payment', () => {
    const result = goalInterest(goal, [entry('b', 250), entry('a', 250)]);
    expect(result.saved).toBe(10);
    expect(result.byEntry.a + result.byEntry.b).toBe(10);
    expect(result.saved).toBe(comparePayoff(settings, 500).saved);
  });
  it('advances scheduled payments before a later contribution, including the payment day', () => {
    // First extra £100 leaves £900. February interest £9 and £510 payment leave £399.
    const result = goalInterest(goal, [
      entry('a', 100),
      entry('b', 100, '2026-02-01'),
    ]);
    expect(result.byEntry.b).toBe(
      comparePayoff({ balance: 399, rate: 12, payment: 510 }, 100).saved,
    );
    expect(result.saved).toBe(result.byEntry.a + result.byEntry.b);
    // Baseline £15; with boosts £9 + £2.99 = £11.99.
    expect(result.saved).toBe(3.01);
  });
  it('keeps month-end payments anchored after February and across leap years', () => {
    const monthly = {
      ...settings,
      balance: 1000,
      payment: 100,
      balanceDate: '2024-01-01',
      nextPaymentDate: '2024-01-31',
    };
    // Jan 31: 910; Feb 29: 819.10. March 30 is BEFORE the March 31 payment.
    const result = goalInterest({ ...goal, settings: monthly }, [
      entry('a', 4, '2024-03-30'),
    ]);
    expect(result.byEntry.a).toBe(
      comparePayoff({ ...monthly, balance: 819.1 }, 4).saved,
    );
  });
  it('recalculates after unlinking and after corrections to settings or transaction dates', () => {
    const both = [entry('a', 200), entry('b', 200)];
    expect(goalInterest(goal, both.slice(1)).saved).toBe(
      comparePayoff(settings, 200).saved,
    );
    expect(
      goalInterest({ ...goal, settings: { ...settings, rate: 0 } }, both)
        .saved,
    ).toBe(0);
    expect(goalInterest(goal, [entry('a', 4, '2026-02-02')]).saved).toBe(
      0.04,
    );
  });
  it('separates goals and marks missing settings without treating them as zero savings', () => {
    const old = { ...goal, id: 'old', active: false };
    const missing = { ...goal, id: 'missing', settings: {} };
    const savings = {
      ...goal,
      id: 'saving',
      kind: 'Savings' as const,
      settings: {},
    };
    const result = interestSummary(
      [goal, old, missing, savings],
      [
        entry('a', 4),
        entry('b', 4, '2026-01-02', 'old'),
        entry('c', 4, '2026-01-02', 'missing'),
      ],
    );
    expect(result.saved).toBe(0.16);
    expect(result.missingGoals.map((g) => g.id)).toEqual(['missing']);
    expect(result.byEntry.c).toBeUndefined();
  });
  it('rejects contributions before the baseline and beyond the remaining principal', () => {
    expect(goalInterest(goal, [entry('a', 4, '2025-12-31')]).error).toMatch(
      /earliest/,
    );
    expect(goalInterest(goal, [entry('a', 1001)]).error).toMatch(/exceed/);
    expect(goalInterest(goal, [entry('a', 4, '2026-04-01')]).error).toMatch(
      /exceed/,
    );
    expect(goalInterest(goal, [entry('a', 1000)]).saved).toBe(15);
  });
  it('validates dates, precision, rates, zero interest and non-amortizing loans', () => {
    expect(() => validateDebtSettings(settings)).not.toThrow();
    expect(() =>
      validateDebtSettings({ ...settings, rate: 0 }),
    ).not.toThrow();
    expect(() =>
      validateDebtSettings({ ...settings, nextPaymentDate: '2026-04-01' }),
    ).toThrow(/one month/);
    expect(() =>
      validateDebtSettings({ ...settings, nextPaymentDate: '2026-02-30' }),
    ).toThrow();
    expect(() =>
      validateDebtSettings({ ...settings, balance: 1.001 }),
    ).toThrow(/decimal/);
    expect(() =>
      validateDebtSettings({ ...settings, payment: 10 }),
    ).toThrow(/cover/);
    expect(() =>
      validateDebtSettings({ ...settings, rate: NaN }),
    ).toThrow();
  });
});
