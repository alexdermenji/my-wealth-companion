import { useMemo, useState } from 'react';
import { MONTHS, BudgetType } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from './hooks';
import { useSettings } from '@/features/settings/hooks';
import { cn } from '@/lib/utils';
import { Check, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFullWidth } from '@/app/AppLayout';
import { BudgetSection } from './components/BudgetSection';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

export default function BudgetPlanPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { fullWidth, setFullWidth } = useFullWidth();

  const { data: allCategories = [] } = useCategories();
  const { data: budgetPlans = [] } = useBudgetPlans(year);
  const { data: settings } = useSettings();
  const setBudgetAmountMutation = useSetBudgetAmount();

  const handleChange = (catId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setBudgetAmountMutation.mutate({ categoryId: catId, year, month, amount: num });
  };

  const currency = settings?.currency ?? '$';

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

  const toBeAllocatedYearly = toBeAllocated.reduce((a, b) => a + b, 0);

  // Check if any category has a budget value for each month
  const hasData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return budgetPlans.some(bp => (bp.months[month] ?? 0) !== 0);
    });
  }, [budgetPlans]);

  const hasAnyData = hasData.some(Boolean);

  const formatAllocation = (v: number, hasEntries: boolean) => {
    if (v === 0 && hasEntries) return <Check className="h-5 w-5 inline stroke-[3]" />;
    if (v === 0) return '-';
    const abs = Math.abs(v);
    const formatted = `${currency}${abs.toLocaleString()}`;
    return v < 0 ? `(${formatted})` : formatted;
  };

  const allocationColor = (v: number) => {
    if (v < 0) return 'text-red-600 font-bold';
    if (v > 0) return 'text-amber-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  const allocationBg = (v: number) => {
    if (v < 0) return 'bg-red-50 dark:bg-red-950/30';
    if (v > 0) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-gray-100 dark:bg-gray-700/50';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 pb-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Budget Planning</h1>
          <p className="text-muted-foreground text-sm">Plan your monthly budgets — allocate every dollar</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027, 2028].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 hidden md:inline-flex"
            onClick={() => setFullWidth(f => !f)}
            title={fullWidth ? 'Default width' : 'Full width'}
          >
            {fullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Card className="flex-1 min-h-0 overflow-auto">
        <CardContent className="p-0">
          <table className="w-full caption-bottom text-sm">
            {/* To be Allocated — sticky header + remaining row */}
            <TableHeader className="sticky top-0 z-20 shadow-sm">
              <TableRow className="bg-gray-200 dark:bg-gray-700">
                <TableHead className="sticky left-0 bg-gray-200 dark:bg-gray-700 z-30 min-w-[150px] font-display font-bold sticky-border-r">
                  To be Allocated
                </TableHead>
                {MONTHS.map((m, i) => (
                  <TableHead key={i} className="text-center min-w-[90px] text-xs bg-gray-200 dark:bg-gray-700">{m}</TableHead>
                ))}
                <TableHead className="text-center font-semibold min-w-[100px] text-xs bg-gray-200 dark:bg-gray-700">{year}</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="sticky left-0 z-30 bg-gray-100 dark:bg-gray-700/50 text-sm font-semibold text-foreground sticky-border-r">Remaining</TableHead>
                {toBeAllocated.map((val, i) => (
                  <TableHead key={i} className={cn('text-center text-sm font-normal', allocationColor(val), allocationBg(val))}>
                    {formatAllocation(val, hasData[i])}
                  </TableHead>
                ))}
                <TableHead className={cn('text-center text-sm font-normal', allocationColor(toBeAllocatedYearly), allocationBg(toBeAllocatedYearly))}>
                  {formatAllocation(toBeAllocatedYearly, hasAnyData)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Budget sections */}
              {BUDGET_TYPES.map(type => (
                <BudgetSection
                  key={type}
                  type={type}
                  categories={allCategories}
                  budgetPlans={budgetPlans}
                  currency={currency}
                  year={year}
                  onAmountChange={handleChange}
                />
              ))}
            </TableBody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
