import { useEffect, useMemo, useState } from 'react';
import { MONTHS, BudgetType, BudgetCategory, BudgetPlan } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/hooks/api/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from '@/hooks/api/useBudgetPlans';
import { useSettings } from '@/hooks/api/useSettings';
import { cn } from '@/lib/utils';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

const SECTION_STYLES: Record<string, { text: string; rowBg: string; headerBg: string }> = {
  Income: { text: 'text-green-700', rowBg: 'bg-green-50 dark:bg-green-950/30', headerBg: 'bg-green-700 dark:bg-green-800' },
  Expenses: { text: 'text-rose-700', rowBg: 'bg-rose-50 dark:bg-rose-950/30', headerBg: 'bg-rose-600 dark:bg-rose-800' },
  Savings: { text: 'text-blue-700', rowBg: 'bg-blue-50 dark:bg-blue-950/30', headerBg: 'bg-blue-600 dark:bg-blue-800' },
  Debt: { text: 'text-purple-700', rowBg: 'bg-purple-50 dark:bg-purple-950/30', headerBg: 'bg-purple-600 dark:bg-purple-800' },
};

function BudgetCell({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [local, setLocal] = useState(value ? value.toString() : '');

  useEffect(() => {
    setLocal(value ? value.toString() : '');
  }, [value]);

  return (
    <Input
      type="number"
      className={cn("h-8 text-sm text-center w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]", className)}
      value={local}
      placeholder="0"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== (value ? value.toString() : '')) {
          onChange(local);
        }
      }}
    />
  );
}

function BudgetSection({
  type,
  categories,
  budgetPlans,
  currency,
  year,
  onAmountChange,
}: {
  type: BudgetType;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  currency: string;
  year: number;
  onAmountChange: (catId: string, month: number, value: string) => void;
}) {
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
        <TableCell colSpan={15} className="p-3 border-none" />
      </TableRow>

      {/* Section header — saturated color with white text */}
      <TableRow className={cn(style.headerBg, 'border-none')}>
        <TableCell className={cn('sticky left-0 z-10 font-bold text-xs text-white py-1.5', style.headerBg)}>
          Group
        </TableCell>
        <TableCell className="font-bold text-xs text-white py-1.5">
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
          <TableCell className={cn('sticky left-0 z-10 text-xs text-muted-foreground', style.rowBg)}>{cat.groupEmoji || cat.group}</TableCell>
          <TableCell className="text-sm font-medium">{cat.name}</TableCell>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
              <TableCell key={mo} className="p-1">
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
        <TableCell colSpan={2} className={cn('sticky left-0 z-10 text-sm font-bold', style.rowBg, style.text)}>
          Total
        </TableCell>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
          <TableCell key={mo} className={cn('text-center text-sm font-bold', style.text)}>
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
