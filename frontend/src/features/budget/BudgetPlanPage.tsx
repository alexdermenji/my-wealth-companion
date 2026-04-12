import { useEffect, useMemo, useState } from 'react';
import { MONTHS, BudgetType } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from './hooks';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFullWidth } from '@/app/AppLayout';
import { BudgetSection } from './components/BudgetSection';
import { useSettings } from '@/features/settings/hooks';
import { BudgetPlanSkeleton } from './components/BudgetPlanSkeleton';
import { BudgetPlanMobileSkeleton } from './components/mobile/BudgetPlanMobileSkeleton';
import { BudgetPlanMobile } from './components/mobile/BudgetPlanMobile';
import { allocationColor } from './constants';
import { useIsMobile } from '@/shared/hooks/use-mobile';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

export default function BudgetPlanPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const isMobile = useIsMobile();
  const { setFullWidth } = useFullWidth();

  useEffect(() => {
    if (!isMobile) setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth, isMobile]);

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: allCategories = [], isLoading: categoriesLoading } = useCategories();
  const { data: budgetPlans = [], isLoading: plansLoading } = useBudgetPlans(year);
  const setBudgetAmountMutation = useSetBudgetAmount();

  const handleChange = (catId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setBudgetAmountMutation.mutate({ categoryId: catId, year, month, amount: num });
  };

  const typeTotals = useMemo(() => {
    const totals: Record<string, number[]> = {
      Income: new Array(12).fill(0),
      Expenses: new Array(12).fill(0),
      Savings: new Array(12).fill(0),
      Debt: new Array(12).fill(0),
    };

    for (const cat of allCategories) {
      const plan = budgetPlans.find(bp => bp.categoryId === cat.id);
      if (!plan) continue;
      const type = cat.type as BudgetType;
      if (!totals[type]) continue;
      for (let m = 1; m <= 12; m++) {
        totals[type][m - 1] += plan.months[m] ?? 0;
      }
    }
    return totals;
  }, [allCategories, budgetPlans]);

  const toBeAllocated = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const income = typeTotals.Income[i];
      const outflow = typeTotals.Expenses[i] + typeTotals.Savings[i] + typeTotals.Debt[i];
      return income - outflow;
    });
  }, [typeTotals]);


  if (settingsLoading || categoriesLoading || plansLoading) {
    return isMobile ? <BudgetPlanMobileSkeleton /> : <BudgetPlanSkeleton />;
  }

  const currency = settings?.currency ?? '£';

  return (
    <div className={cn(
      'flex flex-col h-[calc(100vh-80px)] animate-fade-in',
      isMobile ? 'px-4 w-full' : 'max-w-[90%] mx-auto',
    )}>
      {/* Year pill */}
      <div className="flex items-center justify-center shrink-0 pb-3">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
          <button
            onClick={() => setYear(y => y - 1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-base font-bold text-foreground min-w-[3rem] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isMobile ? (
        <BudgetPlanMobile
          year={year}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          categories={allCategories}
          budgetPlans={budgetPlans}
          typeTotals={typeTotals}
          toBeAllocated={toBeAllocated}
          onAmountChange={handleChange}
          currency={currency}
        />
      ) : (
        <Card className="flex-1 min-h-0 overflow-auto">
          <CardContent className="p-0">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-20 shadow-sm">
                {/* Allocations header */}
                <TableRow className="bg-secondary border-none border-t border-[#f0f2f8] dark:border-border">
                  <TableHead
                    colSpan={2}
                    className="sticky left-0 z-30 bg-secondary w-[200px] py-2.5 pl-4 sticky-border-r"
                    style={{ borderLeft: '3px solid hsl(var(--warning))' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: 'hsl(var(--warning))' }} />
                      <span className="font-display text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--warning))' }}>
                        Allocations
                      </span>
                    </div>
                  </TableHead>
                  {MONTHS.map((m, i) => (
                    <TableHead key={i} className="text-center font-display text-[10px] font-bold uppercase tracking-wider py-2.5 text-muted-foreground bg-secondary min-w-[50px] border-r border-[#f0f2f8] dark:border-border">
                      {m}
                    </TableHead>
                  ))}
                </TableRow>

                {/* Gradient accent line */}
                <tr aria-hidden>
                  <td
                    colSpan={14}
                    style={{
                      padding: 0,
                      height: '1px',
                      border: 'none',
                      background: 'linear-gradient(to right, hsl(var(--warning)), hsl(var(--warning) / 0.5) 30%, transparent 70%)',
                    }}
                  />
                </tr>

                {/* Remaining row */}
                <TableRow className="bg-card">
                  <TableHead colSpan={2} className="sticky left-0 z-30 bg-card sticky-border-r text-xs font-semibold text-muted-foreground">
                    Remaining
                  </TableHead>
                  {toBeAllocated.map((val, i) => (
                    <TableHead key={i} className={cn('text-right pr-2 font-display text-sm font-bold min-w-[50px] border-r border-[#f0f2f8] dark:border-border', allocationColor(val))}>
                      {val === 0 ? '—' : `${currency}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(val))}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {BUDGET_TYPES.map(type => (
                  <BudgetSection
                    key={type}
                    type={type}
                    categories={allCategories}
                    budgetPlans={budgetPlans}
                    onAmountChange={handleChange}
                    currency={currency}
                  />
                ))}
              </TableBody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
