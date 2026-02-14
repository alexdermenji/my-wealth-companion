import { useMemo, useState } from 'react';
import { MONTHS, BudgetType } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from './hooks';
import { useSettings } from '@/features/settings/hooks';
import { cn } from '@/lib/utils';
import { BudgetSection } from './components/BudgetSection';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

export default function BudgetPlanPage() {
  const [year, setYear] = useState(new Date().getFullYear());

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

  const formatAllocation = (v: number) => {
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
    return 'bg-green-50 dark:bg-green-950/30';
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">Budget Planning</h1>
          <p className="text-muted-foreground text-sm">Plan your monthly budgets — allocate every dollar</p>
        </div>
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027, 2028].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* To be Allocated bar */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[150px] font-display font-bold">
                  To be Allocated
                </TableHead>
                {MONTHS.map((m, i) => (
                  <TableHead key={i} className="text-center min-w-[90px] text-xs">{m}</TableHead>
                ))}
                <TableHead className="text-center font-semibold min-w-[100px] text-xs">{year}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="sticky left-0 bg-card z-10 text-sm font-semibold">Remaining</TableCell>
                {toBeAllocated.map((val, i) => (
                  <TableCell key={i} className={cn('text-center text-sm', allocationColor(val), allocationBg(val))}>
                    {formatAllocation(val)}
                  </TableCell>
                ))}
                <TableCell className={cn('text-center text-sm', allocationColor(toBeAllocatedYearly), allocationBg(toBeAllocatedYearly))}>
                  {formatAllocation(toBeAllocatedYearly)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Budget sections */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableBody>
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
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
