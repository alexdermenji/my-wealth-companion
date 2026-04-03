import { useEffect, useState } from 'react';
import { BudgetType, BudgetCategory } from '@/shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCategory, useUpdateCategory } from '@/shared/hooks/useCategories';
import { GroupCombobox } from './GroupCombobox';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: BudgetType;
  editingCategory?: BudgetCategory | null;
  existingGroups: string[];
}

export function CategoryFormDialog({ open, onOpenChange, defaultType, editingCategory, existingGroups }: CategoryFormDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const [form, setForm] = useState({ name: '', type: (defaultType ?? 'Expenses') as BudgetType, group: '' });

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setForm({ name: editingCategory.name, type: editingCategory.type, group: editingCategory.group });
      } else {
        setForm({ name: '', type: defaultType ?? 'Expenses', group: '' });
      }
    }
  }, [open, editingCategory, defaultType]);

  const handleSubmit = () => {
    if (!form.name || !form.group) return;
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: form }, { onSuccess: () => onOpenChange(false) });
    } else {
      createCategory.mutate(form, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createCategory.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">
            {editingCategory ? 'Edit' : 'New'} {form.type} Category
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Group</Label>
            <GroupCombobox
              value={form.group}
              onChange={v => setForm(f => ({ ...f, group: v }))}
              existingGroups={existingGroups}
              placeholder="e.g. Housing, Fun, Self-Care"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as BudgetType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUDGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
            {editingCategory ? 'Update' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
