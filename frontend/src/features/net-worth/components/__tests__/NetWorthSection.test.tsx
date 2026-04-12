import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { NetWorthSection } from '../NetWorthSection';

vi.mock('../../hooks', () => ({
  useDeleteNetWorthItem: () => ({ mutate: vi.fn() }),
  useNetWorthDragReorder: (items: unknown[]) => ({
    displayItems: items,
    dropLineIndex: null,
    dragIndexRef: { current: null },
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
  }),
  useNetWorthHeatMap: () => ({
    monthTotals: {},
    getHeatBg: () => undefined,
  }),
  useNetWorthTabFill: () => ({
    tabFills: {},
    getValue: () => 0,
    handleTab: vi.fn(),
    cellRefs: { current: {} },
  }),
}));

vi.mock('../ItemFormDialog', () => ({
  ItemFormDialog: ({
    open,
    editingItem,
  }: {
    open: boolean;
    editingItem?: { name: string } | null;
  }) => (open ? <tr><td colSpan={14}>{editingItem ? `editing:${editingItem.name}` : 'adding'}</td></tr> : null),
}));

describe('NetWorthSection', () => {
  it('shows a direct link action for unlinked liabilities', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <table>
        <tbody>
          <NetWorthSection
            type="Liability"
            items={[
              { id: 'l1', name: 'Mortgage', group: 'Home', type: 'Liability', order: 0, linkedBudgetCategoryId: null },
              { id: 'l2', name: 'Car Loan', group: 'Car', type: 'Liability', order: 1, linkedBudgetCategoryId: 'debt-1' },
              { id: 'l3', name: 'Old Loan', group: 'Closed', type: 'Liability', order: 2, linkedBudgetCategoryId: 'debt-2' },
            ]}
            values={[
              { itemId: 'l1', year: 2026, months: { 4: 1200 } },
              { itemId: 'l2', year: 2026, months: { 4: 800 } },
              { itemId: 'l3', year: 2026, months: { 4: 0 } },
            ]}
            onAmountChange={vi.fn()}
            existingGroups={['Home', 'Car']}
            currentMonth={4}
          />
        </tbody>
      </table>,
    );

    expect(screen.queryByText('Linked')).not.toBeInTheDocument();
    expect(screen.getByText('Paid off')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Link payment' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Link payment' }));

    expect(screen.getByText('editing:Mortgage')).toBeInTheDocument();
  });

  it('can mark an open liability as paid off from the menu', async () => {
    const user = userEvent.setup();
    const onAmountChange = vi.fn();

    renderWithProviders(
      <table>
        <tbody>
          <NetWorthSection
            type="Liability"
            items={[
              { id: 'l1', name: 'Car Service', group: 'Loan', type: 'Liability', order: 0, linkedBudgetCategoryId: 'debt-1' },
            ]}
            values={[
              { itemId: 'l1', year: 2026, months: { 4: 120 } },
            ]}
            onAmountChange={onAmountChange}
            existingGroups={['Loan']}
            currentMonth={4}
          />
        </tbody>
      </table>,
    );

    await user.click(screen.getByRole('button', { name: 'Open actions for Car Service' }));
    await user.click(screen.getByRole('menuitem', { name: 'Mark as paid off' }));

    expect(onAmountChange).toHaveBeenCalledWith('l1', 4, '0');
  });
});
