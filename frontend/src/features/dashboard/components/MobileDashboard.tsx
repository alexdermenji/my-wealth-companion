import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MONTHS } from '@/shared/types';
import { cn } from '@/lib/utils';
import { BudgetTypeBreakdown } from '../types';

const TYPE_META: Record<string, { accentVar: string; bgClass: string; textClass: string }> = {
  Income:   { accentVar: 'var(--budget-income-accent)',   bgClass: 'bg-budget-income-header',   textClass: 'text-budget-income-text' },
  Expenses: { accentVar: 'var(--budget-expenses-accent)', bgClass: 'bg-budget-expenses-header', textClass: 'text-budget-expenses-text' },
  Savings:  { accentVar: 'var(--budget-savings-accent)',  bgClass: 'bg-budget-savings-header',  textClass: 'text-budget-savings-text' },
  Debt:     { accentVar: 'var(--budget-debt-accent)',     bgClass: 'bg-budget-debt-header',     textClass: 'text-budget-debt-text' },
};

const PROGRESS_GRADIENT = 'linear-gradient(90deg, #b7abff 0%, #8b78ff 38%, hsl(var(--primary)) 100%)';

function getSectionPct(tracked: number, budget: number) {
  if (budget <= 0) return 0;
  return Math.round((tracked / budget * 100) * 10) / 10;
}

// Bar is always the violet gradient, matching the desktop table.
// Only the percentage label is colour-coded (mirrors BudgetBreakdown.tsx pctColorClass).
function pctClass(pct: number): string {
  if (pct === 0)   return 'text-muted-foreground';
  if (pct > 100)   return 'text-expense font-semibold';
  if (pct === 100) return 'text-emerald-500 font-medium';
  if (pct >= 75)   return 'text-amber-500 font-medium';
  return 'text-muted-foreground';
}

interface Props {
  breakdown: BudgetTypeBreakdown[];
  formatCurrency: (v: number) => string;
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MobileDashboard({ breakdown, formatCurrency, year, month, onPrevMonth, onNextMonth }: Props) {
  const [selectedType, setSelectedType] = useState(breakdown[0]?.type ?? 'Income');

  const income   = breakdown.find(b => b.type === 'Income');
  const expenses = breakdown.find(b => b.type === 'Expenses');
  const savings  = breakdown.find(b => b.type === 'Savings');
  const debt     = breakdown.find(b => b.type === 'Debt');

  const net = (income?.totalTracked ?? 0)
    - (expenses?.totalTracked ?? 0)
    - (debt?.totalTracked ?? 0);

  // Build as a single string so the sign and amount never wrap onto separate lines
  const netDisplay = net < 0
    ? `-${formatCurrency(Math.abs(net))}`
    : formatCurrency(net);

  const selected = breakdown.find(b => b.type === selectedType) ?? breakdown[0];
  const meta = TYPE_META[selectedType] ?? TYPE_META['Income'];
  const selectedPct = getSectionPct(selected?.totalTracked ?? 0, selected?.totalBudget ?? 0);

  const visibleItems = selected?.items
    .filter(i => i.budget > 0 || i.tracked > 0)
    .slice()
    .sort((a, b) => b.percentage - a.percentage || b.tracked - a.tracked)
    ?? [];

  return (
    <div className="space-y-4">

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78ff 60%, #a99ef8 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-6 left-4 w-24 h-24 rounded-full bg-white/[0.05]" />

        {/* Month navigation */}
        <div className="relative flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-0.5">
              Budget Dashboard
            </p>
            <p className="font-display text-lg font-bold">{MONTHS[month - 1]} {year}</p>
          </div>
          <div className="flex items-center gap-0.5 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1.5">
            <button
              onClick={onPrevMonth}
              className="p-1 text-white/80 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-1 text-white/80 hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Net number */}
        <div className="relative mb-4">
          <p className="font-display font-extrabold tracking-tight leading-none whitespace-nowrap"
             style={{ fontSize: 'clamp(24px, 8vw, 34px)' }}>
            {netDisplay}
          </p>
          <p className="text-sm text-white/70 mt-1.5">
            {net >= 0 ? 'net positive this month' : 'overspent this month'}
          </p>
        </div>

        {/* Summary chips */}
        <div className="relative flex flex-wrap gap-2">
          {income && (
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0" />
              {formatCurrency(income.totalTracked)} in
            </div>
          )}
          {expenses && (
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-300 flex-shrink-0" />
              {formatCurrency(expenses.totalTracked)} out
            </div>
          )}
          {savings && savings.totalTracked > 0 && (
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-300 flex-shrink-0" />
              {formatCurrency(savings.totalTracked)} saved
            </div>
          )}
        </div>
      </div>

      {/* ── Pill tab bar ──────────────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-card border border-border rounded-full p-1 shadow-sm">
        {breakdown.map(section => {
          const m = TYPE_META[section.type] ?? TYPE_META['Income'];
          const isActive = section.type === selectedType;
          return (
            <button
              key={section.type}
              onClick={() => setSelectedType(section.type)}
              className={cn(
                'flex-1 rounded-full py-2 px-2 text-xs font-semibold transition-all whitespace-nowrap',
                isActive ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              style={isActive ? { background: m.accentVar } : undefined}
            >
              {section.type}
            </button>
          );
        })}
      </div>

      {/* ── Category detail panel ─────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {/* Panel header */}
        <div className={cn('px-4 py-3 border-b', meta.bgClass)}>
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <p className={cn('font-display text-sm font-bold', meta.textClass)}>
                {selected?.type}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {visibleItems.length} categor{visibleItems.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
            <div className="text-right">
              <p className={cn('font-display text-base font-extrabold', meta.textClass)}>
                {formatCurrency(selected?.totalTracked ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                of {formatCurrency(selected?.totalBudget ?? 0)}
                {' · '}
                {selectedPct}%
              </p>
            </div>
          </div>
          {/* Overall progress bar — same grid as category rows so track widths match */}
          <div className="grid gap-x-3" style={{ gridTemplateColumns: '1fr 80px' }}>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 rounded-full overflow-hidden bg-black/10 flex-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(selectedPct, 100)}%`,
                    background: meta.accentVar,
                  }}
                />
              </div>
              <span className={cn('text-[11px] tabular-nums w-8 text-right flex-shrink-0', pctClass(selectedPct))}>
                {Math.round(selectedPct)}%
              </span>
            </div>
            <div /> {/* phantom — aligns with amounts column */}
          </div>
        </div>

        <CardContent className="p-0">
          {visibleItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No data for this period
            </p>
          ) : (
            visibleItems.map(item => {
              const isOver = item.tracked > item.budget && item.budget > 0;
              return (
                <div
                  key={item.categoryId}
                  className="grid items-center gap-x-3 px-4 py-3 border-b last:border-0 hover:bg-secondary/50 transition-colors"
                  style={{ gridTemplateColumns: '1fr 80px' }}
                >
                  {/* Left: name + bar + % — always fills the same 1fr */}
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block mb-1.5">
                      {item.categoryName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 rounded-full overflow-hidden bg-border flex-1">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                            background: PROGRESS_GRADIENT,
                          }}
                        />
                      </div>
                      <span className={cn('text-[11px] tabular-nums w-8 text-right flex-shrink-0', pctClass(item.percentage))}>
                        {Math.round(item.percentage)}%
                      </span>
                    </div>
                  </div>

                  {/* Right: fixed 80px — keeps every bar track the same width */}
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold tabular-nums', isOver ? 'text-expense' : 'text-foreground')}>
                      {item.tracked > 0 ? formatCurrency(item.tracked) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      / {formatCurrency(item.budget)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer total */}
          {visibleItems.length > 0 && (
            <div className="px-4 py-3 bg-secondary border-t-2 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(selected?.totalTracked ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  / {formatCurrency(selected?.totalBudget ?? 0)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
