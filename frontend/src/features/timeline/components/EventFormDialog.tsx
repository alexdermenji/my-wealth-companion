import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTimelineEvent, useUpdateTimelineEvent } from '../hooks';
import type { TimelineEvent } from '../types';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent?: TimelineEvent | null;
}

function normalizeAmount(value: string): number | null {
  const numeric = value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function EventFormDialog({ open, onOpenChange, editingEvent }: EventFormDialogProps) {
  const createMutation = useCreateTimelineEvent();
  const updateMutation = useUpdateTimelineEvent();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(editingEvent?.title ?? '');
    setEventDate(editingEvent?.eventDate ?? '');
    setAmount(editingEvent?.amount === null || editingEvent?.amount === undefined ? '' : String(editingEvent.amount));
    setDescription(editingEvent?.description ?? '');
  }, [editingEvent, open]);

  const handleSubmit = () => {
    if (!title.trim() || !eventDate) return;

    const data = {
      title: title.trim(),
      eventDate,
      type: 'Custom' as const,
      amount: normalizeAmount(amount),
      description: description.trim(),
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{editingEvent ? 'Edit' : 'Add'} timeline event</DialogTitle>
          <DialogDescription>
            Add a one-time dated milestone to show alongside debt payoff forecasts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="timeline-title">Title</Label>
            <Input
              id="timeline-title"
              autoFocus
              placeholder="e.g. SAYE maturity"
              value={title}
              onChange={event => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeline-date">Date</Label>
            <Input
              id="timeline-date"
              type="date"
              value={eventDate}
              onChange={event => setEventDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeline-amount">Amount</Label>
            <Input
              id="timeline-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="Optional"
              value={amount}
              onChange={event => setAmount(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeline-description">Note</Label>
            <Textarea
              id="timeline-description"
              placeholder="Optional note or reminder"
              value={description}
              onChange={event => setDescription(event.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !eventDate || isPending}>
            {editingEvent ? 'Save event' : 'Add event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
