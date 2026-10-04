import { describe, expect, it } from 'vitest';
import { comparePayoff, payoff, summarize, type BoostEntry } from '../model';
const entry = (kind: BoostEntry['kind'], amount: number) =>
  ({ kind, amount }) as BoostEntry;
describe('Goal Boost accounting', () => {
  it('keeps savings and income separate and subtracts only allocated contributions', () => {
    expect(
      summarize([
        entry('saved', 4),
        entry('received', 30),
        entry('contribution', 15),
      ]),
    ).toEqual({ saved: 4, received: 30, contributed: 15, available: 19 });
  });
  it('retains cent precision', () =>
    expect(
      summarize([
        entry('saved', 0.1),
        entry('saved', 0.2),
        entry('contribution', 0.3),
      ]).available,
    ).toBe(0));
});
describe('fixed-rate payoff', () => {
  it('matches a hand-calculated two-month schedule', () => {
    // £1000, 1% monthly: £10 then £5 interest; final payment £505.
    expect(payoff({ balance: 1000, rate: 12, payment: 510 })).toEqual({
      months: 2,
      interest: 15,
    });
    expect(
      comparePayoff({ balance: 1000, rate: 12, payment: 510 }, 500),
    ).toEqual({
      before: { months: 2, interest: 15 },
      after: { months: 1, interest: 5 },
      saved: 10,
      monthsSaved: 1,
    });
  });
  it('saves interest without necessarily shortening a whole month', () => {
    const r = comparePayoff({ balance: 1000, rate: 12, payment: 510 }, 10);
    expect(r.monthsSaved).toBe(0);
    expect(r.saved).toBeGreaterThan(0);
  });
  it('handles zero interest and full repayment', () => {
    expect(
      comparePayoff({ balance: 1000, rate: 0, payment: 100 }, 200).monthsSaved,
    ).toBe(2);
    expect(payoff({ balance: 1000, rate: 20, payment: 50 }, 1000)).toEqual({
      months: 0,
      interest: 0,
    });
  });
  it('rejects non-amortizing payments and invalid inputs', () => {
    expect(() => payoff({ balance: 1000, rate: 12, payment: 10 })).toThrow(
      /does not cover/,
    );
    expect(() =>
      payoff({ balance: 1000, rate: 12, payment: 100 }, 1001),
    ).toThrow(/valid/);
    expect(() => payoff({ balance: NaN, rate: 12, payment: 100 })).toThrow(
      /valid/,
    );
    expect(() => payoff({ balance: 100000, rate: 0, payment: 1 })).toThrow(
      /100-year/,
    );
  });
  it('does not mutate real balances or input parameters', () => {
    const input = Object.freeze({ balance: 15000, rate: 7, payment: 450 });
    comparePayoff(input, 100);
    expect(input.balance).toBe(15000);
  });
});
