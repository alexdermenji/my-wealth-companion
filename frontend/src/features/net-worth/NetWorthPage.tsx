import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MONTHS } from '@/shared/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useFullWidth } from '@/app/AppLayout';
import { useSettings } from '@/features/settings/hooks';
import { getCurrentBudgetMonth } from '@/features/budget/constants';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { NetWorthSection } from './components/NetWorthSection';
import { NetWorthMobile } from './components/mobile/NetWorthMobile';
import { NetWorthMobileSkeleton } from './components/mobile/NetWorthMobileSkeleton';
import { useNetWorthItems, useNetWorthValues, useSetNetWorthValue } from './hooks';
import type { NetWorthType } from './types';

const NET_WORTH_TYPES: NetWorthType[] = ['Asset', 'Liability'];

function formatGridAmount(value: number, currency: string) {
  if (value === 0) return '—';
  return `${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))}`;
}

function formatStatusAmount(value: number, currency: string) {
  return `${value < 0 ? '-' : ''}${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(value)))}`;
}

export default function NetWorthPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const { setFullWidth } = useFullWidth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth, isMobile]);

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: items = [], isLoading: itemsLoading } = useNetWorthItems();
  const { data: values = [], isLoading: valuesLoading } = useNetWorthValues(year);
  const setNetWorthValueMutation = useSetNetWorthValue();

  const currentMonth = getCurrentBudgetMonth(year);
  const actualCurrentMonth = now.getMonth() + 1;

  const handleChange = (itemId: string, month: number, value: string) => {
    const amount = parseFloat(value) || 0;
    setNetWorthValueMutation.mutate({ itemId, year, month, amount });
  };

  const totalsByType = useMemo(() => {
    const bucket: Record<NetWorthType, number[]> = {
      Asset: new Array(12).fill(0),
      Liability: new Array(12).fill(0),
    };
    const valueMap = new Map(values.map(value => [value.itemId, value]));

    for (const item of items) {
      const itemValues = valueMap.get(item.id);
      for (let month = 1; month <= 12; month += 1) {
        bucket[item.type][month - 1] += itemValues?.months[month] ?? 0;
      }
    }

    return bucket;
  }, [items, values]);

  const netWorthByMonth = useMemo(
    () => totalsByType.Asset.map((amount, index) => amount - totalsByType.Liability[index]),
    [totalsByType],
  );

  const populatedMonths = useMemo(() => {
    const months: number[] = [];
    for (let month = 1; month <= 12; month += 1) {
      const hasSavedValue = values.some(value => Object.prototype.hasOwnProperty.call(value.months, month));
      if (hasSavedValue) months.push(month);
    }
    return months;
  }, [values]);

  const summaryMonth = useMemo(() => {
    const eligibleMonths = populatedMonths.filter(month => (
      year === now.getFullYear() ? month <= actualCurrentMonth : true
    ));

    if (eligibleMonths.length > 0) {
      return eligibleMonths[eligibleMonths.length - 1];
    }

    return year === now.getFullYear() ? actualCurrentMonth : null;
  }, [actualCurrentMonth, now, populatedMonths, year]);

  const previousSummaryMonth = useMemo(() => {
    if (summaryMonth === null) return null;
    const previousMonths = populatedMonths.filter(month => month < summaryMonth);
    return previousMonths.length > 0 ? previousMonths[previousMonths.length - 1] : null;
  }, [populatedMonths, summaryMonth]);

  const summary = useMemo(() => {
    if (summaryMonth === null) {
      return { assets: 0, liabilities: 0, netWorth: 0, delta: null };
    }

    const currentIndex = summaryMonth - 1;
    const assets = totalsByType.Asset[currentIndex] ?? 0;
    const liabilities = totalsByType.Liability[currentIndex] ?? 0;
    const netWorth = netWorthByMonth[currentIndex] ?? 0;
    const previousNetWorth = previousSummaryMonth === null ? null : (netWorthByMonth[previousSummaryMonth - 1] ?? 0);
    const delta = previousNetWorth === null ? null : netWorth - previousNetWorth;

    return { assets, liabilities, netWorth, delta };
  }, [netWorthByMonth, previousSummaryMonth, summaryMonth, totalsByType]);

  const existingGroups = useMemo(
    () => [...new Set(items.map(item => item.group).filter(Boolean))].sort(),
    [items],
  );

  if (settingsLoading || itemsLoading || valuesLoading) {
    return isMobile ? <NetWorthMobileSkeleton /> : (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-32 rounded-full bg-muted" />
        <div className="grid gap-3 md:grid-cols-4">
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
        </div>
        <div className="h-[420px] rounded-xl bg-muted" />
      </div>
    );
  }

  const currency = settings?.currency ?? '£';

  return (
    <div
      className={cn(
        'flex flex-col h-[calc(100vh-80px)] gap-4 animate-fade-in',
        isMobile ? 'w-full' : 'max-w-[90%] mx-auto',
      )}
    >
      <h1 className="sr-only">Net Worth</h1>

      <div className="flex items-center justify-center shrink-0">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
          <button
            onClick={() => setYear(current => current - 1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-base font-bold text-foreground min-w-[3rem] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(current => current + 1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isMobile ? (
        <NetWorthMobile
          year={year}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          items={items}
          values={values}
          totalsByType={totalsByType}
          netWorthByMonth={netWorthByMonth}
          onAmountChange={handleChange}
          existingGroups={existingGroups}
          currency={currency}
          currentMonth={currentMonth}
        />
      ) : (
        <>
          <div className="flex shrink-0 gap-3 items-center">
        <div className="flex flex-1 flex-wrap items-center gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="text-xs text-muted-foreground">Assets</span>
            <span className="font-display text-sm font-bold text-[#10b981]">
              {formatStatusAmount(summary.assets, currency)}
            </span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-[#ec4899]" />
            <span className="text-xs text-muted-foreground">Liabilities</span>
            <span className="font-display text-sm font-bold text-[#ec4899]">
              {formatStatusAmount(summary.liabilities, currency)}
            </span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
            <span className="text-xs text-muted-foreground">Net worth</span>
            <span
              className="font-display text-sm font-bold"
              style={{ color: summary.netWorth >= 0 ? 'hsl(var(--success))' : 'hsl(var(--expense))' }}
            >
              {formatStatusAmount(summary.netWorth, currency)}
            </span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="ml-auto flex items-center gap-2 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Change vs {previousSummaryMonth === null ? 'prior month' : MONTHS[previousSummaryMonth - 1]}
            </span>
            {summary.delta === null ? (
              <span className="font-display text-sm font-bold text-muted-foreground">—</span>
            ) : (
              <span
                className="flex items-center gap-1 font-display text-sm font-bold"
                style={{ color: summary.delta >= 0 ? 'hsl(var(--success))' : 'hsl(var(--expense))' }}
              >
                {summary.delta >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {formatStatusAmount(summary.delta, currency)}
              </span>
            )}
          </div>
        </div>
      </div>

      <Card className="flex-1 min-h-0 overflow-auto">
        <CardContent className="p-0">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-20 shadow-sm">
              <TableRow className="bg-secondary border-none border-t border-[#f0f2f8] dark:border-border">
                <TableHead
                  colSpan={2}
                  className="sticky left-0 z-30 bg-secondary w-[200px] py-2.5 pl-4 sticky-border-r"
                  style={{ borderLeft: '3px solid hsl(var(--primary))' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0 bg-[hsl(var(--primary))]" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--primary))]">
                      Net Worth
                    </span>
                  </div>
                </TableHead>
                {MONTHS.map((month, index) => (
                  <TableHead
                    key={month}
                    data-current-month={currentMonth === index + 1 ? 'true' : undefined}
                    className={cn(
                      'text-center font-display text-[10px] font-bold uppercase tracking-wider py-2.5 text-muted-foreground bg-secondary min-w-[50px] border-r border-[#f0f2f8] dark:border-border',
                      currentMonth === index + 1 && 'bg-[hsl(var(--warning)/0.14)] text-foreground shadow-[inset_0_1px_0_hsl(var(--warning)/0.45),inset_0_-1px_0_hsl(var(--warning)/0.45)]',
                    )}
                  >
                    {month}
                  </TableHead>
                ))}
              </TableRow>

              <tr aria-hidden>
                <td
                  colSpan={14}
                  style={{
                    padding: 0,
                    height: '1px',
                    border: 'none',
                    background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.5) 30%, transparent 70%)',
                  }}
                />
              </tr>

              <TableRow className="bg-card">
                <TableHead colSpan={2} className="sticky left-0 z-30 bg-card sticky-border-r text-xs font-semibold text-muted-foreground">
                  Net worth
                </TableHead>
                {netWorthByMonth.map((amount, index) => (
                  <TableHead
                    key={index}
                    data-current-month={currentMonth === index + 1 ? 'true' : undefined}
                    className={cn(
                      'text-right pr-2 font-amount text-sm font-bold min-w-[50px] border-r border-[#f0f2f8] dark:border-border',
                      amount >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--expense))]',
                      currentMonth === index + 1 && 'bg-[hsl(var(--warning)/0.1)] shadow-[inset_0_1px_0_hsl(var(--warning)/0.35),inset_0_-1px_0_hsl(var(--warning)/0.35)]',
                    )}
                  >
                    {amount < 0 ? '-' : ''}
                    {formatGridAmount(amount, currency)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {NET_WORTH_TYPES.map(type => (
                <NetWorthSection
                  key={type}
                  type={type}
                  items={items}
                  values={values}
                  onAmountChange={handleChange}
                  existingGroups={existingGroups}
                  currency={currency}
                  currentMonth={currentMonth}
                />
              ))}
            </TableBody>
          </table>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
