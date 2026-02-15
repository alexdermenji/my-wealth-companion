import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { BudgetCell } from './BudgetCell';

const SECTION_STYLES: Record<string, { text: string; rowBg: string; headerBg: string; headerText: string; accentBorder: string }> = {
  Income: {
    text: 'text-green-700',
    rowBg: 'bg-budget-row',
    headerBg: 'bg-budget-income-header',
    headerText: 'text-budget-income-text',
    accentBorder: 'border-budget-income-accent',
  },
  Expenses: {
    text: 'text-rose-700',
    rowBg: 'bg-budget-row',
    headerBg: 'bg-budget-expenses-header',
    headerText: 'text-budget-expenses-text',
    accentBorder: 'border-budget-expenses-accent',
  },
  Savings: {
    text: 'text-blue-700',
    rowBg: 'bg-budget-row',
    headerBg: 'bg-budget-savings-header',
    headerText: 'text-budget-savings-text',
    accentBorder: 'border-budget-savings-accent',
  },
  Debt: {
    text: 'text-purple-700',
    rowBg: 'bg-budget-row',
    headerBg: 'bg-budget-debt-header',
    headerText: 'text-budget-debt-text',
    accentBorder: 'border-budget-debt-accent',
  },
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

      {/* Section header — custom colors */}
      <TableRow className={cn(style.headerBg, 'border-none')}>
        <TableCell className={cn('sticky left-0 z-10 border-l-4 font-bold text-xs py-1.5', style.headerBg, style.headerText, style.accentBorder)}>
          {type}
        </TableCell>
        {MONTHS.map((m, i) => (
          <TableCell key={i} className={cn('text-center text-xs font-semibold py-1.5', style.headerText)}>{m}</TableCell>
        ))}
        <TableCell className={cn('text-center text-xs font-semibold py-1.5', style.headerText)}>{year}</TableCell>
      </TableRow>

      {/* Category rows — light tinted background */}
      {typeCats.map(cat => (
        <TableRow key={cat.id} className={style.rowBg}>
          <TableCell className={cn('sticky left-0 z-10 min-w-[150px] border-l-4 sticky-border-r', style.rowBg, style.accentBorder)}>
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
        <TableCell className={cn('sticky left-0 z-10 border-l-4 text-sm font-bold sticky-border-r', style.rowBg, style.text, style.accentBorder)}>
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
