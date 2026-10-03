import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetWorthProjectionChart } from '../NetWorthProjectionChart';
import type { NetWorthItem } from '@/features/net-worth/types';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  AreaChart: ({ data }: { data: unknown[] }) => <div data-testid="points">{JSON.stringify(data)}</div>,
  Area: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null, ReferenceLine: () => null,
}));
const items: NetWorthItem[] = [{ id: 'a', name: 'Cash', group: 'Cash', type: 'Asset', order: 0 }];
const points = () => JSON.parse(screen.getByTestId('points').textContent!);

describe('projection historical cutoff', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 3)); });
  afterEach(() => vi.useRealTimers());

  it('starts projection from October and ignores future saved zeros and amounts', () => {
    render(<NetWorthProjectionChart items={items} currency="£" milestoneAmounts={[150000]} values={[
      { itemId: 'a', year: 2026, months: { 9: 110000, 10: 120000, 11: 0, 12: 0 } },
      { itemId: 'a', year: 2027, months: { 1: 999999 } },
    ]} />);
    expect(points().slice(0, 3)).toEqual([
      { label: 'Sep 26', sortKey: 202609, actual: 110000, projected: null },
      { label: 'Oct 26', sortKey: 202610, actual: 120000, projected: 120000 },
      { label: 'Nov 26', sortKey: 202611, actual: null, projected: 130000 },
    ]);
    expect(points()).toHaveLength(14);
    expect(screen.getByText('£120,000')).toBeInTheDocument();
    expect(screen.getByText('+£10,000/mo')).toBeInTheDocument();
  });

  it('preserves a genuine decline to zero in the current month', () => {
    render(<NetWorthProjectionChart items={items} currency="£" milestoneAmounts={[]} values={[
      { itemId: 'a', year: 2026, months: { 9: 100, 10: 0, 11: 900 } },
    ]} />);
    expect(points()[1]).toMatchObject({ actual: 0, projected: 0 });
    expect(points()[2]).toMatchObject({ actual: null, projected: -100 });
  });

  it('does not invent history from future-only entries', () => {
    const { container } = render(<NetWorthProjectionChart items={items} currency="£" milestoneAmounts={[]} values={[
      { itemId: 'a', year: 2026, months: { 11: 100, 12: 200 } },
    ]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
