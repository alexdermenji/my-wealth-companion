import { useMemo, useState } from 'react';
import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { BudgetCell } from './BudgetCell';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { CategoryFormDialog } from '@/features/settings/components/CategoryFormDialog';
import { useForceDeleteCategory } from '@/shared/hooks/useCategories';

const DISPLAY_LABELS: Partial<Record<BudgetType, string>> = {
  Debt: 'Liabilities',
};


const SECTION_STYLES: Record<string, { bg: string; text: string; rowBg: string; accentBorder: string; totalBg: string }> = {
  Income: {
    bg: 'bg-[#43a047]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#43a047]',
    totalBg: 'bg-[#eaf5eb] dark:bg-[#1a2e1b]',
  },
  Expenses: {
    bg: 'bg-[#d81b60]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#d81b60]',
    totalBg: 'bg-[#fce4ec] dark:bg-[#2e1a22]',
  },
  Savings: {
    bg: 'bg-[#7b1fa2]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#7b1fa2]',
    totalBg: 'bg-[#f3e5f5] dark:bg-[#231a2e]',
  },
  Debt: {
    bg: 'bg-[#1565c0]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#1565c0]',
    totalBg: 'bg-[#e3f0fc] dark:bg-[#1a222e]',
  },
};

interface BudgetSectionProps {
  type: BudgetType;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  onAmountChange: (catId: string, month: number, value: string) => void;
}

export function BudgetSection({
  type,
  categories,
  budgetPlans,
  onAmountChange,
}: BudgetSectionProps) {
  const style = SECTION_STYLES[type];
  const displayLabel = DISPLAY_LABELS[type] ?? type;
  const typeCats = categories.filter(c => c.type === type);
  const [adding, setAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<BudgetCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<BudgetCategory | null>(null);
  const forceDeleteMutation = useForceDeleteCategory();

  const existingGroups = useMemo(
    () => [...new Set(categories.map(c => c.group).filter(Boolean))].sort(),
    [categories],
  );

  const getBudget = (catId: string, month: number): number => {
    const plan = budgetPlans.find(bp => bp.categoryId === catId);
    return plan?.months[month] ?? 0;
  };

  const getMonthTotal = (month: number) =>
    typeCats.reduce((s, c) => s + getBudget(c.id, month), 0);

  const fmt = (v: number) => v > 0 ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '-';

  const handleDelete = () => {
    if (!deletingCat) return;
    forceDeleteMutation.mutate(deletingCat.id, { onSuccess: () => setDeletingCat(null) });
  };

  return (
    <>
      {/* Spacer row */}
      <TableRow className="border-none">
        <TableCell colSpan={14} className="p-3 border-none" />
      </TableRow>

      {/* Section header */}
      <TableRow className={cn(style.bg, 'border-none')}>
        <TableCell className={cn('sticky left-0 z-10 font-bold text-xs py-1.5', style.bg, style.text)} colSpan={2}>
          {displayLabel}
        </TableCell>
        {MONTHS.map((m, i) => (
          <TableCell key={i} className={cn('text-center text-xs font-semibold py-1.5', style.text)}>{m}</TableCell>
        ))}
      </TableRow>

      {/* Category rows */}
      {typeCats.map(cat => {
        return (
        <TableRow key={cat.id} className={cn('group/row border-b', style.rowBg)}>
          <TableCell
            className={cn('sticky left-0 z-10 w-[150px] min-w-[150px] max-w-[150px] sticky-border-r pl-0', style.rowBg)}
            colSpan={2}
          >
            <div className="flex items-center h-full pl-3">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground italic leading-tight truncate">{cat.group || cat.name}</span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm font-medium truncate" title={cat.name}>{cat.name}</span>
                  <button
                    className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5"
                    onClick={() => setEditingCat(cat)}
                    title="Edit entry"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="opacity-0 group-hover/row:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5"
                    onClick={() => setDeletingCat(cat)}
                    title="Delete entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </TableCell>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
            <TableCell key={mo}>
              <BudgetCell
                value={getBudget(cat.id, mo)}
                onChange={v => onAmountChange(cat.id, mo, v)}
              />
            </TableCell>
          ))}
        </TableRow>
        );
      })}

      {/* Section total */}
      <TableRow className={style.totalBg}>
        <TableCell colSpan={2} className={cn('sticky left-0 z-10 sticky-border-r text-sm font-bold', style.totalBg)}>Total</TableCell>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
          <TableCell key={mo} className={cn('text-center text-sm font-bold', style.totalBg)}>
            {fmt(getMonthTotal(mo))}
          </TableCell>
        ))}
      </TableRow>

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
      <CategoryFormDialog
        open={adding}
        onOpenChange={setAdding}
        defaultType={type}
        existingGroups={existingGroups}
      />
      <CategoryFormDialog
        open={!!editingCat}
        onOpenChange={o => { if (!o) setEditingCat(null); }}
        editingCategory={editingCat}
        existingGroups={existingGroups}
      />

      {/* Add entry button */}
      <TableRow className="border-none">
        <TableCell className="py-2 border-none sticky left-0 bg-white dark:bg-gray-900" colSpan={2}>
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              'border border-dashed border-muted-foreground/30 text-muted-foreground',
              'hover:border-muted-foreground/60 hover:text-foreground hover:bg-muted/50',
            )}
            onClick={() => setAdding(true)}
          >
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-muted-foreground/15">
              <Plus className="h-2.5 w-2.5" />
            </span>
            Add entry
          </button>
        </TableCell>
      </TableRow>
    </>
  );
}
