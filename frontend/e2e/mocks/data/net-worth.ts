import type { NetWorthItem, NetWorthValue } from '../../../src/features/net-worth/types';

export const mockNetWorthItems: NetWorthItem[] = [
  { id: 'nw1', name: 'Cash Savings', group: 'Cash', type: 'Asset', order: 0 },
  { id: 'nw2', name: 'Investment Portfolio', group: 'Investments', type: 'Asset', order: 1 },
  { id: 'nw3', name: 'Mortgage', group: 'Home', type: 'Liability', order: 0 },
];

export const mockNetWorthValues: NetWorthValue[] = [
  { itemId: 'nw1', year: 2026, months: { 1: 25000, 2: 26500, 3: 28000, 4: 28250 } },
  { itemId: 'nw2', year: 2026, months: { 1: 90000, 2: 91000, 3: 94000, 4: 95500 } },
  { itemId: 'nw3', year: 2026, months: { 1: 70000, 2: 69500, 3: 69000, 4: 68500 } },
];
