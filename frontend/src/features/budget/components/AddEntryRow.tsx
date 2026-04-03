import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useCreateCategory } from '@/shared/hooks/useCategories';
import type { BudgetType } from '@/shared/types';

interface AddEntryRowProps {
  type: BudgetType;
  onCancel: () => void;
  onAdded: () => void;
}

export function AddEntryRow({ type, onCancel, onAdded }: AddEntryRowProps) {
  const [group, setGroup] = useState('');
  const [name, setName] = useState('');
  const createMutation = useCreateCategory();

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    createMutation.mutate(
      {
        name: trimmedName,
        type,
        group: group.trim() || trimmedName,
        groupEmoji: '',
      },
      { onSuccess: () => onAdded() },
    );
  };

  return (
    <TableRow className="border-none">
      <TableCell className="py-1 sticky left-0 z-10">
        <Input
          placeholder="Category"
          value={group}
          onChange={e => setGroup(e.target.value)}
          className="h-8 text-sm w-28"
        />
      </TableCell>
      <TableCell className="py-1">
        <Input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-8 text-sm w-32"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') handleAdd();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </TableCell>
      <TableCell colSpan={12} className="py-1">
        <div className="flex gap-2">
          <button
            className="text-sm font-semibold hover:underline"
            onClick={handleAdd}
            disabled={createMutation.isPending}
          >
            Add
          </button>
          <button
            className="text-sm text-muted-foreground hover:underline"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
