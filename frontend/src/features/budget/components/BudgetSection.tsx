import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { BudgetCell } from './BudgetCell';

const SECTION_STYLES: Record<string, { text: string; rowBg: string; headerBg: string }> = {
  Income: { text: 'text-green-700', rowBg: 'bg-green-50 dark:bg-green-950/30', headerBg: 'bg-green-800 dark:bg-green-900' },
  Expenses: { text: 'text-rose-700', rowBg: 'bg-rose-50 dark:bg-rose-950/30', headerBg: 'bg-rose-800 dark:bg-rose-900' },
  Savings: { text: 'text-blue-700', rowBg: 'bg-blue-50 dark:bg-blue-950/30', headerBg: 'bg-blue-800 dark:bg-blue-900' },
  Debt: { text: 'text-purple-700', rowBg: 'bg-purple-50 dark:bg-purple-950/30', headerBg: 'bg-purple-800 dark:bg-purple-900' },
};

interface BudgetSectionProps {
  type: BudgetType;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  currency: string;
  year: number;
  onAmountChange: (catId: string, month: number, value: string) => void;
}

export function BudgetSection({
  type,
  categories,
  budgetPlans,
  currency,
  year,
  onAmountChange,
}: BudgetSectionProps) {
  const style = SECTION_STYLES[type];
  const typeCats = categories.filter(c => c.type === type);

  const getBudget = (catId: string, month: number): number => {
    const plan = budgetPlans.find(bp => bp.categoryId === catId);
    return plan?.months[month] ?? 0;
  };

  const getCatYearTotal = (catId: string) =>
    Array.from({ length: 12 }, (_, i) => getBudget(catId, i + 1)).reduce((a, b) => a + b, 0);

  const getMonthTotal = (month: number) =>
    typeCats.reduce((s, c) => s + getBudget(c.id, month), 0);

  const yearGrandTotal = Array.from({ length: 12 }, (_, i) => getMonthTotal(i + 1)).reduce((a, b) => a + b, 0);

  const fmt = (v: number) => v > 0 ? `${currency}${v.toLocaleString()}` : '-';

  if (typeCats.length === 0) return null;

  return (
    <>
      {/* Spacer row for visual separation between sections */}
      <TableRow className="border-none">
        <TableCell colSpan={14} className="p-3 border-none" />
      </TableRow>

      {/* Section header — saturated color with white text */}
      <TableRow className={cn(style.headerBg, 'border-none')}>
        <TableCell className={cn('sticky left-0 z-10 font-bold text-xs text-white py-1.5', style.headerBg)}>
          {type}
        </TableCell>
        {MONTHS.map((m, i) => (
          <TableCell key={i} className="text-center text-xs font-semibold text-white py-1.5">{m}</TableCell>
        ))}
        <TableCell className="text-center text-xs font-semibold text-white py-1.5">{year}</TableCell>
      </TableRow>

      {/* Category rows — light tinted background */}
      {typeCats.map(cat => (
        <TableRow key={cat.id} className={style.rowBg}>
          <TableCell className={cn('sticky left-0 z-10 min-w-[150px] sticky-border-r', style.rowBg)}>
            <div className="text-sm font-medium">{cat.name}</div>
            {cat.group && (
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-black/5 text-muted-foreground">
                {cat.groupEmoji ? `${cat.groupEmoji} ` : ''}{cat.group}
              </span>
            )}
          </TableCell>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
              <TableCell key={mo} className={cn('p-1', mo === 1 && 'pl-3')}>
                <BudgetCell
                  value={getBudget(cat.id, mo)}
                  onChange={v => onAmountChange(cat.id, mo, v)}
                  className={style.rowBg}
                />
              </TableCell>
          ))}
          <TableCell className="text-center font-medium text-sm">
            {fmt(getCatYearTotal(cat.id))}
          </TableCell>
        </TableRow>
      ))}

      {/* Section total */}
      <TableRow className={style.rowBg}>
        <TableCell className={cn('sticky left-0 z-10 text-sm font-bold sticky-border-r', style.rowBg, style.text)}>
          Total
        </TableCell>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
          <TableCell key={mo} className={cn('text-center text-sm font-bold', style.text, mo === 1 && 'pl-3')}>
            {fmt(getMonthTotal(mo))}
          </TableCell>
        ))}
        <TableCell className={cn('text-center text-sm font-bold', style.text)}>
          {fmt(yearGrandTotal)}
        </TableCell>
      </TableRow>
    </>
  );
}
