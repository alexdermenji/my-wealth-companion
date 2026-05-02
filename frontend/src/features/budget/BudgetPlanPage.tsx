import { useEffect, useMemo, useState } from 'react';
import { MONTHS, BudgetType } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from './hooks';
import { cn } from '@/lib/utils';
import { useFullWidth } from '@/app/AppLayout';
import { BudgetSection } from './components/BudgetSection';
import { useSettings } from '@/features/settings/hooks';
import { BudgetPlanSkeleton } from './components/BudgetPlanSkeleton';
import { BudgetPlanMobileSkeleton } from './components/mobile/BudgetPlanMobileSkeleton';
import { BudgetPlanMobile } from './components/mobile/BudgetPlanMobile';
import { allocationColor, getCurrentBudgetMonth } from './constants';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useDashboardSummary } from '@/features/dashboard/hooks';
import BudgetBreakdown from '@/features/dashboard/components/BudgetBreakdown';
import { MobileDashboard } from '@/features/dashboard/components/MobileDashboard';
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

type Tab = 'overview' | 'edit';

export default function BudgetPlanPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isMobile = useIsMobile();
  const { setFullWidth } = useFullWidth();

  useEffect(() => {
    if (!isMobile) setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth, isMobile]);

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: allCategories = [], isLoading: categoriesLoading } = useCategories();
  const { data: budgetPlans = [], isLoading: plansLoading } = useBudgetPlans(year);
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(year, selectedMonth);
  const setBudgetAmountMutation = useSetBudgetAmount();
  const currentMonth = getCurrentBudgetMonth(year);

  const currency = settings?.currency ?? '$';

  const thisYear = new Date().getFullYear();
  const firstYear = settings?.startYear ?? thisYear;
  const lastYear = thisYear + 5;
  const yearOptions = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, i) => firstYear + i,
  );

  const formatCurrency = (val: number) =>
    `${currency}${val.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

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

  const breakdown = summary?.breakdown ?? [];

  return (
    <div className={cn(
      'flex flex-col h-[calc(100vh-80px)] animate-fade-in',
      isMobile ? 'w-full' : 'max-w-[90%] mx-auto',
    )}>
      {/* Tab bar — date selectors live here, right-aligned, tab-specific */}
      <div role="tablist" className="flex items-center border-b border-border shrink-0 mb-4">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'edit'}
          onClick={() => setActiveTab('edit')}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            activeTab === 'edit'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Edit Budget
        </button>

        {/* Overview (desktop): Year + Month dropdowns */}
        {activeTab === 'overview' && !isMobile && (
          <div className="ml-auto flex gap-2 pb-1">
            <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Edit Budget (desktop): Year dropdown only */}
        {activeTab === 'edit' && !isMobile && (
          <div className="ml-auto pb-1">
            <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Overview tab ───────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {summaryLoading || settingsLoading ? (
            isMobile ? <BudgetPlanMobileSkeleton /> : <DashboardSkeleton />
          ) : isMobile ? (
            <MobileDashboard
              breakdown={breakdown}
              formatCurrency={formatCurrency}
              year={year}
              month={selectedMonth}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
            />
          ) : (
            <div className="overflow-auto flex-1">
              <BudgetBreakdown breakdown={breakdown} formatCurrency={formatCurrency} />
            </div>
          )}
        </>
      )}

      {/* ── Edit Budget tab ────────────────────────────────────────── */}
      {activeTab === 'edit' && (
        <>
          {settingsLoading || categoriesLoading || plansLoading ? (
            isMobile ? <BudgetPlanMobileSkeleton /> : <BudgetPlanSkeleton />
          ) : isMobile ? (
            <BudgetPlanMobile
              year={year}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
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
                        <TableHead
                          key={i}
                          data-current-month={currentMonth === i + 1 ? 'true' : undefined}
                          className={cn(
                            'text-center font-display text-[10px] font-bold uppercase tracking-wider py-2.5 text-muted-foreground bg-secondary min-w-[50px] border-r border-[#f0f2f8] dark:border-border',
                            currentMonth === i + 1 && 'bg-[hsl(var(--warning)/0.14)] text-foreground shadow-[inset_0_1px_0_hsl(var(--warning)/0.45),inset_0_-1px_0_hsl(var(--warning)/0.45)]',
                          )}
                        >
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
                        <TableHead
                          key={i}
                          data-current-month={currentMonth === i + 1 ? 'true' : undefined}
                          className={cn(
                            'text-right pr-2 font-amount text-sm font-bold min-w-[50px] border-r border-[#f0f2f8] dark:border-border',
                            allocationColor(val),
                            currentMonth === i + 1 && 'bg-[hsl(var(--warning)/0.1)] shadow-[inset_0_1px_0_hsl(var(--warning)/0.35),inset_0_-1px_0_hsl(var(--warning)/0.35)]',
                          )}
                        >
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
                        currentMonth={currentMonth}
                      />
                    ))}
                  </TableBody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
