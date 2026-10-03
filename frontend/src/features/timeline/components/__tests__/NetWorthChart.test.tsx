import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NetWorthChart } from '../NetWorthChart';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  AreaChart: ({ data }: { data: unknown[] }) => <div data-testid="chart-data">{JSON.stringify(data)}</div>,
  Area: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null,
}));
const items: NetWorthItem[] = [
  { id: 'asset', name: 'Savings', group: 'Cash', type: 'Asset', order: 0 },
  { id: 'debt', name: 'Mortgage', group: 'Home', type: 'Liability', order: 1 },
];
function show(values: NetWorthValue[]) {
  return render(<NetWorthChart items={items} values={values} currency="£" />);
}
function points() { return JSON.parse(screen.getByTestId('chart-data').textContent!); }

describe('NetWorthChart historical cutoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 3));
  });
  afterEach(() => vi.useRealTimers());

  it('ends every period in October, excluding future zeros and nonzero entries', () => {
    show([
      { itemId: 'asset', year: 2026, months: { 9: 240000, 10: 250000, 11: 0, 12: 0 } },
      { itemId: 'debt', year: 2026, months: { 9: 130000, 10: 125000, 11: 0, 12: 0 } },
      { itemId: 'asset', year: 2027, months: { 1: 999999 } },
    ]);
    for (const period of ['All', '6M', '1Y', '2Y']) {
      fireEvent.click(screen.getByRole('button', { name: period }));
      expect(points().map((point: { label: string }) => point.label)).toEqual(['Sep 26', 'Oct 26']);
      expect(screen.getByText('£125,000')).toBeInTheDocument();
      expect(screen.getByText('+£15,000')).toBeInTheDocument();
    }
  });
  it('uses the last recorded month when October has no entries', () => {
    show([{ itemId: 'asset', year: 2026, months: { 8: 100, 9: 200, 11: 0 } }]);
    expect(points().at(-1).label).toBe('Sep 26');
    expect(screen.getByText('£200')).toBeInTheDocument();
  });
  it('preserves real zero balances and negative net worth in the current month', () => {
    show([
      { itemId: 'asset', year: 2026, months: { 9: 100, 10: 0 } },
      { itemId: 'debt', year: 2026, months: { 9: 50, 10: 50 } },
    ]);
    expect(points().at(-1)).toMatchObject({ assets: 0, liabilities: 50, netWorth: -50 });
    expect(screen.getByText('£-50')).toBeInTheDocument();
  });
  it('handles empty history after changing periods and receiving future-only data', () => {
    const { rerender } = show([{ itemId: 'asset', year: 2026, months: { 8: 100, 9: 200 } }]);
    fireEvent.click(screen.getByRole('button', { name: '6M' }));
    rerender(<NetWorthChart items={items} values={[{ itemId: 'asset', year: 2027, months: { 1: 100 } }]} currency="£" />);
    expect(screen.queryByTestId('chart-data')).not.toBeInTheDocument();
  });
});
