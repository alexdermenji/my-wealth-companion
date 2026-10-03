import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transactionsApi } from '../api';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/shared/auth/supabase', () => ({ supabase: { from } }));

// Model server ordering before pagination so a late-added, backdated entry
// must reach page one instead of being sorted within an already selected page.
const rows = [
  { Id: 'old-b', Date: '2026-10-03', CreatedAt: null },
  { Id: 'first', Date: '2026-10-03', CreatedAt: '2026-10-03T10:00:00Z' },
  { Id: 'latest', Date: '2026-09-01', CreatedAt: '2026-10-03T11:00:00Z' },
  { Id: 'old-a', Date: '2026-10-03', CreatedAt: null },
].map(row => ({ ...row, Amount: 10, Details: '', AccountId: 'account', BudgetType: 'Income', BudgetPositionId: null }));

beforeEach(() => {
  from.mockImplementation(() => {
    const orders: { column: string; ascending: boolean; nullsFirst?: boolean }[] = [];
    let range: [number, number] | undefined;
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn((column: string, options: { ascending: boolean; nullsFirst?: boolean }) => {
        orders.push({ column, ...options });
        return query;
      }),
      range: vi.fn((start: number, end: number) => { range = [start, end]; return query; }),
      then: (resolve: (result: unknown) => unknown) => {
        const sorted = [...rows].sort((a, b) => {
          for (const { column, ascending, nullsFirst } of orders) {
            const left = a[column as keyof typeof a];
            const right = b[column as keyof typeof b];
            if (left === right) continue;
            if (left === null) return nullsFirst ? -1 : 1;
            if (right === null) return nullsFirst ? 1 : -1;
            return String(left).localeCompare(String(right)) * (ascending ? 1 : -1);
          }
          return 0;
        });
        return Promise.resolve(resolve({ data: range ? sorted.slice(range[0], range[1] + 1) : sorted, error: null, count: sorted.length }));
      },
    };
    return query;
  });
});

describe('transaction creation order', () => {
  it('shows newly added backdated entries first and stabilizes legacy ties', async () => {
    expect((await transactionsApi.getAll()).map(tx => tx.id)).toEqual(['latest', 'first', 'old-b', 'old-a']);
  });
  it('sorts before applying server pagination', async () => {
    const first = await transactionsApi.getPage({ page: 1, pageSize: 1 });
    const second = await transactionsApi.getPage({ page: 2, pageSize: 1 });
    expect(first.transactions.map(tx => tx.id)).toEqual(['latest']);
    expect(second.transactions.map(tx => tx.id)).toEqual(['first']);
    expect(first.totalCount).toBe(4);
  });
  it('preserves the order when filtering by month without a year', async () => {
    const result = await transactionsApi.getPage({ page: 1, pageSize: 2, month: 10 });
    expect(result.transactions.map(tx => tx.id)).toEqual(['first', 'old-b']);
    expect(result.totalCount).toBe(3);
  });
});
