import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GroupCombobox } from '@/features/settings/components/GroupCombobox';
import { useCreateNetWorthItem, useUpdateNetWorthItem } from '../hooks';
import type { NetWorthItem, NetWorthType } from '../types';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: NetWorthType;
  existingGroups: string[];
  editingItem?: NetWorthItem | null;
}

export function ItemFormDialog({ open, onOpenChange, type, existingGroups, editingItem }: ItemFormDialogProps) {
  const [name, setName]   = useState(editingItem?.name ?? '');
  const [group, setGroup] = useState(editingItem?.group ?? '');

  const createMutation = useCreateNetWorthItem();
  const updateMutation = useUpdateNetWorthItem();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(editingItem?.name ?? '');
    setGroup(editingItem?.group ?? '');
  }, [open, editingItem]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), group: group.trim(), type };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit' : 'Add'} {type}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              autoFocus
              placeholder={type === 'Asset' ? 'e.g. ISA Portfolio' : 'e.g. Mortgage'}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Group</Label>
            <GroupCombobox
              value={group}
              onChange={setGroup}
              existingGroups={existingGroups}
              placeholder={type === 'Asset' ? 'e.g. Investments' : 'e.g. Property'}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {editingItem ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
