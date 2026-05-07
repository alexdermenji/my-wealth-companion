import { describe, it, expect } from 'vitest';
import { computeWantsNeedsSplit } from '../computeWantsNeedsSplit';
import type { Transaction } from '@/shared/types';
import type { BudgetCategory } from '@/shared/types';

const tx = (id: string, budgetType: Transaction['budgetType'], amount: number, budgetPositionId = ''): Transaction => ({
  id,
  date: '2026-05-10',
  amount,
  details: '',
  accountId: 'a1',
  budgetType,
  budgetPositionId,
});

const cat = (id: string, spendingType?: BudgetCategory['spendingType']): BudgetCategory => ({
  id,
  name: 'Test',
  type: 'Expenses',
  group: 'Test',
  order: 1,
  spendingType,
});

describe('computeWantsNeedsSplit', () => {
  // Cycle 1 — basic split
  it('correctly splits expense transactions into wants and needs amounts', () => {
    const categories = [cat('rent', 'need'), cat('netflix', 'want')];
    const transactions = [
      tx('t1', 'Income', 3000),
      tx('t2', 'Expenses', 1200, 'rent'),
      tx('t3', 'Expenses', 15, 'netflix'),
    ];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.needsAmount).toBe(1200);
    expect(result.wantsAmount).toBe(15);
    expect(result.incomeAmount).toBe(3000);
    expect(result.needsPct).toBe(40);   // 1200/3000
    expect(result.wantsPct).toBe(1);    // 15/3000 → rounds to 1%
  });

  it('uses absolute values for amounts', () => {
    const categories = [cat('rent', 'need')];
    const transactions = [
      tx('t1', 'Income', 2000),
      tx('t2', 'Expenses', -800, 'rent'),  // negative amount
    ];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.needsAmount).toBe(800);
  });

  // Cycle 2 — unclassified exclusion
  it('excludes transactions linked to unclassified categories', () => {
    const categories = [cat('rent', 'need'), cat('misc')]; // misc has no spendingType
    const transactions = [
      tx('t1', 'Income', 3000),
      tx('t2', 'Expenses', 1000, 'rent'),
      tx('t3', 'Expenses', 500, 'misc'),
    ];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.needsAmount).toBe(1000);
    expect(result.wantsAmount).toBe(0);
  });

  it('excludes transactions with no matching category', () => {
    const categories = [cat('rent', 'need')];
    const transactions = [
      tx('t1', 'Income', 3000),
      tx('t2', 'Expenses', 1000, 'rent'),
      tx('t3', 'Expenses', 200, 'unknown-id'),
    ];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.needsAmount).toBe(1000);
    expect(result.wantsAmount).toBe(0);
  });

  // Cycle 3 — zero income
  it('returns zero percentages when there is no income', () => {
    const categories = [cat('rent', 'need')];
    const transactions = [tx('t1', 'Expenses', 500, 'rent')];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.incomeAmount).toBe(0);
    expect(result.needsPct).toBe(0);
    expect(result.wantsPct).toBe(0);
    expect(result.needsAmount).toBe(500);
  });

  it('returns all zeros for empty input', () => {
    const result = computeWantsNeedsSplit([], []);
    expect(result).toEqual({ wantsAmount: 0, needsAmount: 0, incomeAmount: 0, wantsPct: 0, needsPct: 0 });
  });

  it('counts all Debt transactions as needs regardless of category classification', () => {
    const categories = [cat('car-loan', undefined)]; // no spendingType set
    const transactions = [
      tx('t1', 'Income', 3000),
      tx('t2', 'Debt', 400, 'car-loan'),
    ];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.needsAmount).toBe(400);
    expect(result.wantsAmount).toBe(0);
    expect(result.needsPct).toBe(13); // 400/3000
  });

  it('uses referenceIncome as denominator when provided, ignoring actual income', () => {
    const categories = [cat('rent', 'need')];
    const transactions = [
      // no income transaction yet (salary lands end of month)
      tx('t1', 'Expenses', 600, 'rent'),
    ];
    const result = computeWantsNeedsSplit(transactions, categories, 3000);
    expect(result.incomeAmount).toBe(0);   // actual income still tracked as 0
    expect(result.needsPct).toBe(20);      // 600 / 3000
    expect(result.wantsPct).toBe(0);
  });

  it('falls back to actual income when referenceIncome is not provided', () => {
    const categories = [cat('rent', 'need')];
    const transactions = [
      tx('t1', 'Income', 2000),
      tx('t2', 'Expenses', 400, 'rent'),
    ];
    const result = computeWantsNeedsSplit(transactions, categories);
    expect(result.needsPct).toBe(20); // 400 / 2000
  });
});
