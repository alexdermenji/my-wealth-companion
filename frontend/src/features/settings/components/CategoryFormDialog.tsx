import { useEffect, useState } from 'react';
import { BudgetType, BudgetCategory } from '@/shared/types';
import type { SpendingType } from '@/shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
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

  const [form, setForm] = useState({
    name: '',
    type: (defaultType ?? 'Expenses') as BudgetType,
    group: '',
    spendingType: 'need' as SpendingType,
  });

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setForm({
          name: editingCategory.name,
          type: editingCategory.type,
          group: editingCategory.group,
          spendingType: editingCategory.spendingType ?? 'need',
        });
      } else {
        setForm({ name: '', type: defaultType ?? 'Expenses', group: '', spendingType: 'need' });
      }
    }
  }, [open, editingCategory, defaultType]);

  const handleSubmit = () => {
    if (!form.name || !form.group) return;
    const payload = {
      name: form.name,
      type: form.type,
      group: form.group,
      ...(form.type === 'Expenses' ? { spendingType: form.spendingType } : {}),
    };
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createCategory.mutate(payload, { onSuccess: () => onOpenChange(false) });
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
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as BudgetType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUDGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.type === 'Expenses' && (
            <div className="flex items-center gap-3">
              <Switch
                checked={form.spendingType === 'want'}
                onCheckedChange={checked => setForm(f => ({ ...f, spendingType: checked ? 'want' : 'need' }))}
              />
              <Label className="mb-0">Want</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Needs</strong> are expenses you can't avoid — rent, groceries, utilities.</p>
                    <p><strong>Wants</strong> are discretionary — subscriptions, dining out, hobbies.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
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
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
            {editingCategory ? 'Update' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
