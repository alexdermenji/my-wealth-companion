import { useState } from 'react';
import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { BudgetCell } from './BudgetCell';
import { AddEntryRow } from './AddEntryRow';
import { Trash2 } from 'lucide-react';
import { useForceDeleteCategory } from '@/shared/hooks/useCategories';

const DISPLAY_LABELS: Partial<Record<BudgetType, string>> = {
  Debt: 'Liabilities',
};

const SECTION_STYLES: Record<string, { bg: string; text: string; rowBg: string; accentBorder: string }> = {
  Income: {
    bg: 'bg-[#43a047]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#43a047]',
  },
  Expenses: {
    bg: 'bg-[#d81b60]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#d81b60]',
  },
  Savings: {
    bg: 'bg-[#7b1fa2]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#7b1fa2]',
  },
  Debt: {
    bg: 'bg-[#1565c0]',
    text: 'text-white',
    rowBg: 'bg-white dark:bg-gray-900',
    accentBorder: 'border-[#1565c0]',
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
  const forceDeleteMutation = useForceDeleteCategory();

  const getBudget = (catId: string, month: number): number => {
    const plan = budgetPlans.find(bp => bp.categoryId === catId);
    return plan?.months[month] ?? 0;
  };

  const getMonthTotal = (month: number) =>
    typeCats.reduce((s, c) => s + getBudget(c.id, month), 0);

  const fmt = (v: number) => (v > 0 ? v.toFixed(2) : '-');

  const handleDelete = (catId: string) => {
    forceDeleteMutation.mutate(catId);
  };

  return (
    <>
      {/* Spacer row */}
      <TableRow className="border-none">
        <TableCell colSpan={14} className="p-3 border-none" />
      </TableRow>

      {/* Section header */}
      <TableRow className={cn(style.bg, 'border-none')}>
        <TableCell className={cn('sticky left-0 z-10 font-bold text-xs py-1.5', style.bg, style.text)}>
          Category
        </TableCell>
        <TableCell className={cn('font-bold text-xs py-1.5', style.text)}>
          {displayLabel}
        </TableCell>
        {MONTHS.map((m, i) => (
          <TableCell key={i} className={cn('text-center text-xs font-semibold py-1.5', style.text)}>{m}</TableCell>
        ))}
      </TableRow>

      {/* Category rows */}
      {typeCats.map(cat => (
        <TableRow key={cat.id} className={cn('group/row border-b', style.rowBg)}>
          <TableCell className={cn('sticky left-0 z-10 min-w-[120px] sticky-border-r', style.rowBg)}>
            <span className="text-sm text-muted-foreground italic">{cat.group || cat.name}</span>
          </TableCell>
          <TableCell className="min-w-[130px] relative">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{cat.name}</span>
              <button
                className="opacity-0 group-hover/row:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-1 p-0.5"
                onClick={() => handleDelete(cat.id)}
                title="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </TableCell>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
            <TableCell key={mo} className="p-1">
              <BudgetCell
                value={getBudget(cat.id, mo)}
                onChange={v => onAmountChange(cat.id, mo, v)}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}

      {/* Section total */}
      <TableRow className={style.rowBg}>
        <TableCell className={cn('sticky left-0 z-10 sticky-border-r', style.rowBg)} />
        <TableCell className="text-sm font-bold">Total</TableCell>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
          <TableCell key={mo} className="text-center text-sm font-bold">
            {fmt(getMonthTotal(mo))}
          </TableCell>
        ))}
      </TableRow>

      {/* Add entry */}
      {adding ? (
        <AddEntryRow type={type} onCancel={() => setAdding(false)} onAdded={() => setAdding(false)} />
      ) : (
        <TableRow className="border-none">
          <TableCell colSpan={14} className="py-1 border-none">
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setAdding(true)}
            >
              + Add entry
            </button>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
