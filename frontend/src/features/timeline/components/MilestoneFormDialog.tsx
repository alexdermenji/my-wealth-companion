import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNetWorthMilestone, useUpdateNetWorthMilestone } from '../milestonesHooks';
import type { UserMilestone } from '../utils';

interface MilestoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMilestone?: UserMilestone | null;
}

export function MilestoneFormDialog({ open, onOpenChange, editingMilestone }: MilestoneFormDialogProps) {
  const createMutation = useCreateNetWorthMilestone();
  const updateMutation = useUpdateNetWorthMilestone();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount(editingMilestone ? String(editingMilestone.amount) : '');
    setLabel(editingMilestone?.label ?? '');
    setTargetDate(editingMilestone?.targetDate ?? '');
    setNote(editingMilestone?.note ?? '');
  }, [editingMilestone, open]);

  const parsedAmount = Number(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    const data: Omit<UserMilestone, 'id'> = {
      amount: parsedAmount,
      label: label.trim() || null,
      targetDate: targetDate || null,
      note: note.trim(),
    };
    if (editingMilestone) {
      updateMutation.mutate({ id: editingMilestone.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{editingMilestone ? 'Edit' : 'Add'} milestone</DialogTitle>
          <DialogDescription>
            Set a net worth target and optionally a deadline to track whether you&apos;re on track.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ms-amount">Target amount</Label>
            <Input
              id="ms-amount"
              autoFocus
              type="number"
              inputMode="numeric"
              placeholder="e.g. 50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ms-label">Label <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="ms-label"
              placeholder="e.g. House deposit"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ms-date">Target date <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="ms-date"
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ms-note">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="ms-note"
              placeholder="Any context about this goal"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {editingMilestone ? 'Save milestone' : 'Add milestone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
