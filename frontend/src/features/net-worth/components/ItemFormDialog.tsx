import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupCombobox } from '@/features/settings/components/GroupCombobox';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateNetWorthItem, useUpdateNetWorthItem } from '../hooks';
import type { NetWorthItem, NetWorthType } from '../types';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: NetWorthType;
  existingGroups: string[];
  editingItem?: NetWorthItem | null;
}

const NO_LINK_VALUE = '__no-linked-budget-category__';

export function ItemFormDialog({ open, onOpenChange, type, existingGroups, editingItem }: ItemFormDialogProps) {
  const [name, setName]   = useState(editingItem?.name ?? '');
  const [group, setGroup] = useState(editingItem?.group ?? '');
  const [linkedBudgetCategoryId, setLinkedBudgetCategoryId] = useState<string | null>(
    editingItem?.linkedBudgetCategoryId ?? null,
  );

  const createMutation = useCreateNetWorthItem();
  const updateMutation = useUpdateNetWorthItem();
  const { data: debtCategories = [], isLoading: debtCategoriesLoading } = useCategories('Debt', type === 'Liability' && open);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(editingItem?.name ?? '');
    setGroup(editingItem?.group ?? '');
    setLinkedBudgetCategoryId(editingItem?.linkedBudgetCategoryId ?? null);
  }, [open, editingItem]);

  const handleLinkedBudgetChange = (value: string) => {
    const nextLinkedBudgetCategoryId = value === NO_LINK_VALUE ? null : value;
    setLinkedBudgetCategoryId(nextLinkedBudgetCategoryId);

    if (editingItem || !nextLinkedBudgetCategoryId) return;

    const selectedCategory = debtCategories.find(category => category.id === nextLinkedBudgetCategoryId);
    if (!selectedCategory) return;

    setName(selectedCategory.name);
    setGroup(selectedCategory.group);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      group: group.trim(),
      type,
      linkedBudgetCategoryId: type === 'Liability' ? linkedBudgetCategoryId : null,
    };
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

          {type === 'Liability' && (
            <div className="space-y-1.5">
              <Label htmlFor="linked-budget-category">Linked budget debt</Label>
              <Select
                value={linkedBudgetCategoryId ?? NO_LINK_VALUE}
                onValueChange={handleLinkedBudgetChange}
              >
                <SelectTrigger id="linked-budget-category">
                  <SelectValue placeholder="Choose an existing budget debt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LINK_VALUE}>No linked payment</SelectItem>
                  {debtCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {debtCategoriesLoading
                  ? 'Loading debt categories...'
                  : debtCategories.length > 0
                    ? 'Pick a debt category to reuse its name and payment plan for timeline forecasts.'
                    : 'No debt categories yet. You can still save the liability and link it later.'}
              </p>
            </div>
          )}
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
