import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../../types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { allocationColor } from '../../constants';
import { BudgetSectionMobile } from './BudgetSectionMobile';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

interface BudgetPlanMobileProps {
  year: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  typeTotals: Record<string, number[]>;
  toBeAllocated: number[];
  onAmountChange: (catId: string, month: number, value: string) => void;
  currency: string;
}

export function BudgetPlanMobile({
  selectedMonth,
  onMonthChange,
  categories,
  budgetPlans,
  toBeAllocated,
  onAmountChange,
  currency,
}: BudgetPlanMobileProps) {
  const remaining = toBeAllocated[selectedMonth - 1];

  const remainingBg = remaining < 0
    ? 'bg-[rgba(236,72,153,0.1)]'
    : remaining > 0
      ? 'bg-[rgba(16,185,129,0.1)]'
      : 'bg-[rgba(16,185,129,0.15)]';

  const fmtRemaining = remaining === 0
    ? '—'
    : `${currency}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(remaining))}`;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-3 pb-3">
        <button
          onClick={() => onMonthChange(selectedMonth - 1)}
          disabled={selectedMonth <= 1}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-display text-base font-bold text-foreground min-w-[100px] text-center">
          {MONTHS[selectedMonth - 1]}
        </span>
        <button
          onClick={() => onMonthChange(selectedMonth + 1)}
          disabled={selectedMonth >= 12}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Remaining bar */}
      <div className={cn('flex items-center justify-between pl-4 pr-[50px] py-3 rounded-xl mb-5', remainingBg)}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Remaining
        </span>
        <span className={cn('font-display text-sm font-bold', allocationColor(remaining))}>
          {fmtRemaining}
        </span>
      </div>

      {/* Section cards */}
      {BUDGET_TYPES.map(type => (
        <BudgetSectionMobile
          key={type}
          type={type}
          categories={categories}
          budgetPlans={budgetPlans}
          onAmountChange={onAmountChange}
          currency={currency}
          month={selectedMonth}
        />
      ))}
    </div>
  );
}
