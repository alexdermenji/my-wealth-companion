import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateNetWorthItem, useUpdateNetWorthItem } from '../../hooks';
import { ItemFormDialog } from '../ItemFormDialog';

vi.mock('@/shared/hooks/useCategories');
vi.mock('../../hooks');

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

describe('ItemFormDialog', () => {
  beforeEach(() => {
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = vi.fn(() => false);
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = vi.fn();
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = vi.fn();
    }

    mockCreate.mockReset();
    mockUpdate.mockReset();

    vi.mocked(useCreateNetWorthItem).mockReturnValue({
      mutate: mockCreate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateNetWorthItem>);

    vi.mocked(useUpdateNetWorthItem).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateNetWorthItem>);

    vi.mocked(useCategories).mockReturnValue({
      data: [
        { id: 'debt-1', name: 'Car Loan', type: 'Debt', group: 'Car Debt', order: 0 },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
  });

  it('prefills a new liability from a debt category and stores the link', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ItemFormDialog
        open
        onOpenChange={vi.fn()}
        type="Liability"
        existingGroups={['Car Debt']}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Linked budget debt' }));
    await user.click(screen.getByRole('option', { name: 'Car Loan' }));

    expect(screen.getByLabelText('Name')).toHaveValue('Car Loan');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Car Loan',
          group: 'Car Debt',
          type: 'Liability',
          linkedBudgetCategoryId: 'debt-1',
        }),
        expect.any(Object),
      );
    });
  });

  it('does not show budget linking for assets', () => {
    renderWithProviders(
      <ItemFormDialog
        open
        onOpenChange={vi.fn()}
        type="Asset"
        existingGroups={[]}
      />,
    );

    expect(screen.queryByText('Linked budget debt')).not.toBeInTheDocument();
    expect(useCategories).toHaveBeenCalledWith('Debt', false);
  });
});
