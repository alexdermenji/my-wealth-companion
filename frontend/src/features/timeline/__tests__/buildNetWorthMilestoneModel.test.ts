import { describe, it, expect } from 'vitest';
import { buildNetWorthMilestoneModel } from '../utils';
import type { UserMilestone } from '../utils';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asset(id: string): NetWorthItem {
  return { id, name: id, group: 'Test', type: 'Asset', order: 1 };
}

function values(itemId: string, year: number, months: Record<number, number>): NetWorthValue {
  return { itemId, year, months };
}

function milestone(overrides: Partial<UserMilestone> & { amount: number }): UserMilestone {
  return { id: '1', label: null, targetDate: null, note: '', ...overrides };
}

// ---------------------------------------------------------------------------
// Shared fixtures — 7 months of £1k/month growth, latest = Jul 2024, NW = 7k
// ---------------------------------------------------------------------------

const GROWING_ITEMS = [asset('a1')];
const GROWING_VALUES = [values('a1', 2024, { 1: 1_000, 2: 2_000, 3: 3_000, 4: 4_000, 5: 5_000, 6: 6_000, 7: 7_000 })];
// 6 deltas of £1k → monthlyGrowth = 1000

// ---------------------------------------------------------------------------
// Cycle 1 — No data → unavailable
// ---------------------------------------------------------------------------

describe('buildNetWorthMilestoneModel', () => {
  it('returns unavailable when there is no net worth data', () => {
    const result = buildNetWorthMilestoneModel({
      items: [],
      values: [],
      milestones: [milestone({ amount: 100_000 })],
    });
    expect(result.milestones[0].status).toBe('unavailable');
    expect(result.milestones[0].monthLabel).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Cycle 2 — Positive trend, no target date → projected
  // -------------------------------------------------------------------------

  it('returns projected with a month label when trend is positive and no target date', () => {
    // NW = 7k, growth = 1k/mo, target = 10k → 3 months away → Oct 2024
    const result = buildNetWorthMilestoneModel({
      items: GROWING_ITEMS,
      values: GROWING_VALUES,
      milestones: [milestone({ amount: 10_000 })],
    });
    expect(result.milestones[0].status).toBe('projected');
    expect(result.milestones[0].monthLabel).toBe('Oct 2024');
    expect(result.milestones[0].monthsAway).toBe(3);
  });

  // -------------------------------------------------------------------------
  // Cycle 3 — Already reached → reached
  // -------------------------------------------------------------------------

  it('returns reached with the first-hit month when net worth is at or above the target', () => {
    // NW hits 5k in May, still holds it in Jul
    const result = buildNetWorthMilestoneModel({
      items: GROWING_ITEMS,
      values: GROWING_VALUES,
      milestones: [milestone({ amount: 5_000 })],
    });
    expect(result.milestones[0].status).toBe('reached');
    expect(result.milestones[0].monthLabel).toBe('May 2024');
  });

  // -------------------------------------------------------------------------
  // Cycle 4 — Was reached, now below → off-track
  // -------------------------------------------------------------------------

  it('returns off-track with the first-hit month when milestone was reached but net worth is now below', () => {
    // Hit 5k in Feb, dropped to 3k in Mar
    const dippingItems = [asset('a1')];
    const dippingValues = [values('a1', 2024, { 1: 2_000, 2: 5_000, 3: 3_000 })];
    const result = buildNetWorthMilestoneModel({
      items: dippingItems,
      values: dippingValues,
      milestones: [milestone({ amount: 5_000 })],
    });
    expect(result.milestones[0].status).toBe('off-track');
    expect(result.milestones[0].monthLabel).toBe('Feb 2024');
  });

  // -------------------------------------------------------------------------
  // Cycle 5 — Positive trend, projection beats target date → on-track
  // -------------------------------------------------------------------------

  it('returns on-track when the projected date is before the target date', () => {
    // NW = 7k, growth = 1k/mo, target = 10k → projected Oct 2024
    // Target date Dec 2024 → projection beats it → on-track
    const result = buildNetWorthMilestoneModel({
      items: GROWING_ITEMS,
      values: GROWING_VALUES,
      milestones: [milestone({ amount: 10_000, targetDate: '2024-12-01' })],
    });
    expect(result.milestones[0].status).toBe('on-track');
    expect(result.milestones[0].monthLabel).toBe('Oct 2024');
  });

  // -------------------------------------------------------------------------
  // Cycle 6 — Positive trend, projection misses target date → off-track
  // -------------------------------------------------------------------------

  it('returns off-track when the projected date is after the target date', () => {
    // NW = 7k, growth = 1k/mo, target = 10k → projected Oct 2024
    // Target date Sep 2024 → projection misses it → off-track
    const result = buildNetWorthMilestoneModel({
      items: GROWING_ITEMS,
      values: GROWING_VALUES,
      milestones: [milestone({ amount: 10_000, targetDate: '2024-09-01' })],
    });
    expect(result.milestones[0].status).toBe('off-track');
    expect(result.milestones[0].monthLabel).toBe('Oct 2024');
  });

  // -------------------------------------------------------------------------
  // Cycle 7 — Negative trend + target date → off-track (the main fix)
  // -------------------------------------------------------------------------

  it('returns off-track (not unavailable) when trend is negative but a target date is set', () => {
    const decliningItems = [asset('a1')];
    const decliningValues = [values('a1', 2024, { 1: 7_000, 2: 6_000, 3: 5_000, 4: 4_000, 5: 3_000, 6: 2_000, 7: 1_000 })];
    const result = buildNetWorthMilestoneModel({
      items: decliningItems,
      values: decliningValues,
      milestones: [milestone({ amount: 10_000, targetDate: '2025-12-01' })],
    });
    expect(result.milestones[0].status).toBe('off-track');
    expect(result.milestones[0].monthLabel).toBe('Dec 2025');
  });

  it('returns unavailable when trend is negative and no target date is set', () => {
    const decliningItems = [asset('a1')];
    const decliningValues = [values('a1', 2024, { 1: 7_000, 2: 6_000, 3: 5_000, 4: 4_000, 5: 3_000, 6: 2_000, 7: 1_000 })];
    const result = buildNetWorthMilestoneModel({
      items: decliningItems,
      values: decliningValues,
      milestones: [milestone({ amount: 10_000 })],
    });
    expect(result.milestones[0].status).toBe('unavailable');
  });

  // -------------------------------------------------------------------------
  // Cycle 8 — Custom label vs auto-formatted label
  // -------------------------------------------------------------------------

  it('uses the custom label when provided', () => {
    const result = buildNetWorthMilestoneModel({
      items: [],
      values: [],
      milestones: [milestone({ amount: 100_000, label: 'House deposit' })],
    });
    expect(result.milestones[0].label).toBe('House deposit');
  });

  it('auto-formats the label when none is provided', () => {
    const result = buildNetWorthMilestoneModel({
      items: [],
      values: [],
      milestones: [
        milestone({ id: '1', amount: 100_000 }),
        milestone({ id: '2', amount: 1_000_000 }),
        milestone({ id: '3', amount: 500 }),
      ],
    });
    expect(result.milestones[0].label).toBe('100k');
    expect(result.milestones[1].label).toBe('1M');
    expect(result.milestones[2].label).toBe('500');
  });
});
