import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { useCreateTimelineEvent, useUpdateTimelineEvent } from '../../hooks';
import { EventFormDialog } from '../EventFormDialog';

vi.mock('../../hooks');

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

describe('EventFormDialog', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdate.mockReset();

    vi.mocked(useCreateTimelineEvent).mockReturnValue({
      mutate: mockCreate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTimelineEvent>);

    vi.mocked(useUpdateTimelineEvent).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateTimelineEvent>);
  });

  it('creates a one-time custom timeline event', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EventFormDialog
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Title'), 'SAYE maturity');
    await user.type(screen.getByLabelText('Date'), '2027-03-15');
    await user.type(screen.getByLabelText('Amount'), '2500.50');
    await user.type(screen.getByLabelText('Note'), 'Shares become available');
    await user.click(screen.getByRole('button', { name: 'Add event' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        {
          title: 'SAYE maturity',
          eventDate: '2027-03-15',
          type: 'Custom',
          amount: 2500.5,
          description: 'Shares become available',
        },
        expect.any(Object),
      );
    });
  });

  it('updates an existing custom event', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EventFormDialog
        open
        onOpenChange={vi.fn()}
        editingEvent={{
          id: 'event-1',
          title: 'BAYE release',
          eventDate: '2027-06-01',
          type: 'Custom',
          amount: 1200,
          description: 'Original note',
        }}
      />,
    );

    const note = screen.getByLabelText('Note');
    await user.clear(note);
    await user.type(note, 'Updated note');
    await user.click(screen.getByRole('button', { name: 'Save event' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        {
          id: 'event-1',
          data: {
            title: 'BAYE release',
            eventDate: '2027-06-01',
            type: 'Custom',
            amount: 1200,
            description: 'Updated note',
          },
        },
        expect.any(Object),
      );
    });
  });
});
