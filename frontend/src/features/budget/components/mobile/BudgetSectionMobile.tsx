import { useMemo, useState } from 'react';
import { BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../../types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BudgetCell } from '../BudgetCell';
import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryFormDialog } from '@/features/settings/components/CategoryFormDialog';
import { useForceDeleteCategory } from '@/shared/hooks/useCategories';
import { DISPLAY_LABELS, SECTION_ACCENT, SECTION_CSS_KEY } from '../../constants';
import { useTabFill, useHeatMap } from '../../hooks';

interface BudgetSectionMobileProps {
  type: BudgetType;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  onAmountChange: (catId: string, month: number, value: string) => void;
  currency: string;
  month: number;
}

export function BudgetSectionMobile({
  type,
  categories,
  budgetPlans,
  onAmountChange,
  currency,
  month,
}: BudgetSectionMobileProps) {
  const accentColor  = SECTION_ACCENT[type];
  const cssKey       = SECTION_CSS_KEY[type];
  const displayLabel = DISPLAY_LABELS[type] ?? type;
  const totalText    = `var(--budget-${cssKey}-header-text)`;

  const [adding, setAdding]           = useState(false);
  const [editingCat, setEditingCat]   = useState<BudgetCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<BudgetCategory | null>(null);

  const forceDeleteMutation = useForceDeleteCategory();

  const typeCats = useMemo(
    () => categories.filter(c => c.type === type).sort((a, b) => a.order - b.order),
    [categories, type],
  );

  const existingGroups = useMemo(
    () => [...new Set(categories.map(c => c.group).filter(Boolean))].sort(),
    [categories],
  );

  const { tabFills, getBudget } = useTabFill({ budgetPlans, onAmountChange });
  const { monthTotals } = useHeatMap({ typeCats, budgetPlans, tabFills, cssKey });

  const fmt = (v: number) => v > 0 ? `${currency}${new Intl.NumberFormat('en-US').format(v)}` : '—';

  const handleDelete = () => {
    if (!deletingCat) return;
    forceDeleteMutation.mutate(deletingCat.id, { onSuccess: () => setDeletingCat(null) });
  };

  return (
    <>
      <div className="mb-5">
        {/* Section header — outside the card */}
        <div className="flex items-center justify-between pl-1 pr-[50px] mb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              {displayLabel}
            </span>
          </div>
          <span className="font-display text-sm font-bold" style={{ color: totalText }}>
            {fmt(monthTotals[month] ?? 0)}
          </span>
        </div>

        {/* Card body */}
        <Card
          className="overflow-hidden"
          style={{ borderLeft: `3px solid ${accentColor}` }}
        >
          {/* Category rows */}
          {typeCats.map((cat, i) => (
            <div
              key={cat.id}
              className={cn(
                'flex items-center justify-between pl-4 pr-1 py-3',
                i < typeCats.length - 1 && 'border-b border-border/40',
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-2">
                <span className="text-[10px] italic text-muted-foreground leading-tight truncate">
                  {cat.group || cat.name}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {cat.name}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-24">
                  <BudgetCell
                    value={getBudget(cat.id, month)}
                    onChange={v => onAmountChange(cat.id, month, v)}
                    tabHint={false}
                    accentColor={accentColor}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center min-h-[44px] min-w-[36px] rounded text-muted-foreground/50">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingCat(cat)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingCat(cat)}
                      className="text-[hsl(var(--expense))] focus:text-[hsl(var(--expense))]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Add category button */}
          <div className={cn('px-4 py-3', typeCats.length > 0 && 'border-t border-border/40')}>
            <button
              className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary w-full justify-center"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3 w-3" />
              Add category
            </button>
          </div>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingCat} onOpenChange={o => { if (!o) setDeletingCat(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingCat?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the category and all its budget data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit dialogs */}
      <CategoryFormDialog open={adding} onOpenChange={setAdding} defaultType={type} existingGroups={existingGroups} />
      <CategoryFormDialog
        open={!!editingCat}
        onOpenChange={o => { if (!o) setEditingCat(null); }}
        editingCategory={editingCat}
        existingGroups={existingGroups}
      />
    </>
  );
}
