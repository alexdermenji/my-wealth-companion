import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { useSettings } from '@/features/settings/hooks';
import NetWorthPage from '../NetWorthPage';
import { useNetWorthItems, useNetWorthValues, useSetNetWorthValue } from '../hooks';

vi.mock('@/features/settings/hooks');
vi.mock('../hooks');
vi.mock('../components/NetWorthSection', () => ({
  NetWorthSection: ({ type }: { type: string }) => (
    <tr>
      <td colSpan={14}>{type} section</td>
    </tr>
  ),
}));

describe('NetWorthPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));

    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: '£' },
      isLoading: false,
    } as ReturnType<typeof useSettings>);

    vi.mocked(useNetWorthItems).mockReturnValue({
      data: [
        { id: 'a1', name: 'Cash', group: 'Savings', type: 'Asset', order: 0 },
        { id: 'l1', name: 'Mortgage', group: 'Home', type: 'Liability', order: 0 },
      ],
      isLoading: false,
    } as ReturnType<typeof useNetWorthItems>);

    vi.mocked(useNetWorthValues).mockReturnValue({
      data: [
        { itemId: 'a1', year: 2026, months: { 2: 1000, 3: 1200 } },
        { itemId: 'l1', year: 2026, months: { 2: 400, 3: 500 } },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useNetWorthValues>);

    vi.mocked(useSetNetWorthValue).mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSetNetWorthValue>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the year pill, summary strip, and net worth row', () => {
    renderWithProviders(<NetWorthPage />);

    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
    expect(screen.getAllByText('Net worth').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('£1,200')).toBeInTheDocument();
    expect(screen.getByText('£500')).toBeInTheDocument();
    expect(screen.getAllByText('£700').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Change vs Feb')).toBeInTheDocument();
    expect(screen.getByText('£100')).toBeInTheDocument();
  });

  it('passes the selected year to the values hook when navigating', () => {
    renderWithProviders(<NetWorthPage />);
    expect(useNetWorthValues).toHaveBeenLastCalledWith(2026);

    fireEvent.click(screen.getByRole('button', { name: 'Next year' }));

    expect(screen.getByText('2027')).toBeInTheDocument();
    expect(useNetWorthValues).toHaveBeenLastCalledWith(2027);
  });

  it('marks the current month only for the current year', () => {
    const { container } = renderWithProviders(<NetWorthPage />);

    expect(container.querySelectorAll('[data-current-month="true"]').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Apr')[0]).toHaveAttribute('data-current-month', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Next year' }));

    expect(container.querySelector('[data-current-month="true"]')).toBeNull();
  });
});
