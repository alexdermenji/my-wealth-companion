import { useEffect, useMemo, useState } from 'react';
import { MONTHS, BudgetType } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from './hooks';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFullWidth } from '@/app/AppLayout';
import { BudgetSection } from './components/BudgetSection';
import { BudgetNavProvider } from './components/BudgetNavContext';
import { useSettings } from '@/features/settings/hooks';
import { getCurrencySymbol } from '@/features/settings/types';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

export default function BudgetPlanPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { setFullWidth } = useFullWidth();

  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);


  const { data: settings } = useSettings();
  const currency = getCurrencySymbol(settings?.currency ?? '$');
  const { data: allCategories = [] } = useCategories();
  const { data: budgetPlans = [] } = useBudgetPlans(year);
  const setBudgetAmountMutation = useSetBudgetAmount();

  const handleChange = (catId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setBudgetAmountMutation.mutate({ categoryId: catId, year, month, amount: num });
  };

  // Compute per-type monthly totals
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

  // To be Allocated = Income - (Expenses + Savings + Debt)
  const toBeAllocated = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const income = typeTotals.Income[i];
      const outflow = typeTotals.Expenses[i] + typeTotals.Savings[i] + typeTotals.Debt[i];
      return income - outflow;
    });
  }, [typeTotals]);

  const allocationColor = (v: number) => {
    if (v < 0) return 'text-red-600 font-bold';
    if (v > 0) return 'text-amber-600 font-semibold';
    return 'text-green-600 font-semibold';
  };


  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in max-w-[90%] mx-auto">
      {/* Year navigation */}
      <div className="flex items-center justify-center gap-4 shrink-0 pb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(y => y - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-2xl font-display font-bold">{year}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(y => y + 1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Card className="flex-1 min-h-0 overflow-auto">
        <CardContent className="p-0">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-20 shadow-sm">
              {/* Allocations header */}
              <TableRow className="bg-[#e8901e] dark:bg-[#b5700f]">
                <TableHead colSpan={1} className="sticky left-0 z-30 bg-[#e8901e] dark:bg-[#b5700f] text-white font-bold text-xs py-1.5 sticky-border-r w-[150px] min-w-[150px] max-w-[150px]">
                  Allocations
                </TableHead>
                {MONTHS.map((m, i) => (
                  <TableHead key={i} className="text-center text-xs font-semibold py-1.5 text-white w-[90px] min-w-[90px] max-w-[90px] border-r border-[#c97d1a]">{m}</TableHead>
                ))}
              </TableRow>

              {/* Remaining row */}
              <TableRow className="bg-white dark:bg-gray-800">
                <TableHead colSpan={1} className="sticky left-0 z-30 bg-white dark:bg-gray-800 sticky-border-r text-sm font-bold text-foreground w-[150px] min-w-[150px] max-w-[150px]">Remaining</TableHead>
                {toBeAllocated.map((val, i) => (
                  <TableHead key={i} className={cn('text-center text-sm font-medium min-w-[60px] border-r border-gray-100 dark:border-gray-800', allocationColor(val))}>
                    {val === 0 ? '-' : currency + new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <BudgetNavProvider>
              <TableBody>
                {/* Budget sections */}
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
            </BudgetNavProvider>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
