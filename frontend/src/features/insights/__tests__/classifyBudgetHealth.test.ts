import { describe, it, expect } from 'vitest';
import { classifyBudgetHealth } from '../classifyBudgetHealth';

const classify = (needsPct: number, wantsPct: number, savingsPct: number, debtPct = 0) =>
  classifyBudgetHealth({ needsPct, wantsPct, savingsPct, debtPct });

describe('classifyBudgetHealth', () => {
  // 1. Total > 100%
  it('warns when spending alone exceeds income', () => {
    const r = classify(70, 40, 0);
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe("You're spending more than you earn");
    expect(r.subtext).toContain('above your income');
  });

  it('warns when spending + savings together exceed income', () => {
    // 55 + 30 + 20 = 105 — savings push it over, not spending alone
    const r = classify(55, 30, 20);
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe("You're over your income");
    expect(r.subtext).toContain('above your income');
  });

  // 2. Both Needs AND Wants over target
  it('warns when both Needs >50% and Wants >30%', () => {
    const r = classify(60, 35, 0);
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe('Spending is out of balance');
  });

  it('Targets exceeded takes priority over debt-driven check', () => {
    // needsPct=60 (debtPct=30, expenseNeeds=30), wantsPct=35 — both targets blown, Wants not excused by debt
    const r = classify(60, 35, 0, 30);
    expect(r.statusLabel).toBe('Spending is out of balance');
  });

  // 3 & 4. Needs >50%, debt-driven (expenseNeeds <= 50)
  it('shows positive when debt drives Needs high but savings target is met', () => {
    // needsPct=70, debtPct=30 → expenseNeeds=40 ≤ 50, savingsPct=20
    const r = classify(70, 10, 20, 30);
    expect(r.type).toBe('positive');
    expect(r.statusLabel).toBe('Strong debt progress');
  });

  it('shows info when debt drives Needs high and some savings exist', () => {
    const r = classify(70, 10, 5, 30);
    expect(r.type).toBe('info');
    expect(r.statusLabel).toBe('Debt-focused month');
  });

  it('shows info when all income goes to essentials + debt, no savings', () => {
    // User scenario: 70% Needs (30% debt), 30% Wants, 0% Savings
    const r = classify(70, 10, 0, 30);
    expect(r.type).toBe('info');
    expect(r.statusLabel).toBe('Focused on debt');
  });

  // 5. Needs >50%, not debt-driven
  it('warns when essential expenses alone exceed 50%', () => {
    const r = classify(60, 10, 5, 5); // expenseNeeds = 55 > 50
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe('Essential costs are too high');
  });

  it('warns when needs high with no debt at all', () => {
    const r = classify(60, 10, 5, 0);
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe('Essential costs are too high');
  });

  // 4b. Needs high from pure expenses but savings are strong
  it('shows info (not warning) when essential expenses are high but savings target is met', () => {
    const r = classify(60, 10, 25, 0);
    expect(r.type).toBe('info');
    expect(r.statusLabel).toBe('High costs, but saving well');
  });

  // Rounding guard: debtPct slightly > needsPct due to independent Math.round
  it('handles rounding artefact where debtPct > needsPct without crashing', () => {
    const r = classify(50, 10, 5, 51);
    expect(r.statusLabel).toBeDefined();
    expect(r.type).toBeDefined();
  });

  // 6. Wants >30%, savings strong
  it('shows info when Wants are high but savings >=20%', () => {
    const r = classify(40, 35, 20);
    expect(r.type).toBe('info');
    expect(r.statusLabel).toBe('Wants are high');
  });

  // 7. Wants >30%, savings suffering
  it('warns when Wants are high and savings are below target', () => {
    const r = classify(40, 35, 10);
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe('Wants are reducing savings');
  });

  it('warns when Wants high and no savings at all', () => {
    const r = classify(40, 35, 0);
    expect(r.type).toBe('warning');
    expect(r.statusLabel).toBe('Wants are reducing savings');
  });

  // 8. No savings
  it('shows info when on track but no savings yet', () => {
    const r = classify(40, 20, 0);
    expect(r.type).toBe('info');
    expect(r.statusLabel).toBe('No savings yet');
  });

  // 9. Savings below 20% but spending on track
  it('shows info when savings exist but below 20% target', () => {
    const r = classify(40, 20, 10);
    expect(r.type).toBe('info');
    expect(r.statusLabel).toBe('Room to save more');
    expect(r.subtext).toContain('10%');
  });

  // 10. All targets met
  it('shows positive when all 50/30/20 targets are met', () => {
    const r = classify(50, 30, 20);
    expect(r.type).toBe('positive');
    expect(r.statusLabel).toBe("You're on track");
  });

  it('shows positive when well within all targets', () => {
    const r = classify(30, 15, 25);
    expect(r.type).toBe('positive');
    expect(r.statusLabel).toBe("You're on track");
  });

  // All results have actionLabel
  it('every scenario returns an actionLabel', () => {
    const scenarios = [
      classify(70, 40, 0),       // over 100%, spending alone
      classify(55, 30, 20),      // over 100%, savings push it
      classify(60, 35, 0),       // both needs + wants over
      classify(70, 10, 20, 30),  // debt-driven, strong savings
      classify(70, 10, 5, 30),   // debt-driven, some savings
      classify(70, 10, 0, 30),   // debt-driven, no savings
      classify(60, 10, 25, 0),   // pure expenses high, savings strong
      classify(60, 10, 5),       // pure expenses high, savings weak
      classify(40, 35, 20),      // wants high, savings strong
      classify(40, 35, 10),      // wants high, savings weak
      classify(40, 20, 0),       // no savings yet
      classify(40, 20, 10),      // room to save more
      classify(30, 15, 25),      // all on track
    ];
    scenarios.forEach(r => expect(r.actionLabel).toBeDefined());
  });
});
