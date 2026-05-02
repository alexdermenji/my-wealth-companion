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

        {/* Gauge + metrics */}
        {(() => {
          const incomeVal   = income?.totalTracked   ?? 0;
          const expensesVal = expenses?.totalTracked ?? 0;
          const savingsVal  = savings?.totalTracked  ?? 0;
          const debtVal     = debt?.totalTracked     ?? 0;
          const expBudget   = expenses?.totalBudget  ?? 0;

          const usedPct  = expBudget > 0 ? Math.round((expensesVal / expBudget) * 100) : 0;
          const isOver   = usedPct > 100;
          const isEmpty  = expBudget === 0 && expensesVal === 0;

          // Arc parameters: semicircle from left to right, r=45, centre (55,65)
          const ARC_LEN = 141;
          const fillLen    = isEmpty ? 0 : Math.min(usedPct / 100, 1) * ARC_LEN;
          const dashOffset = ARC_LEN - fillLen;

          const arcColor = isEmpty       ? 'rgba(255,255,255,0.25)'
                         : isOver        ? '#f9a8d4'  // pink-300
                         : usedPct >= 80 ? '#fbbf24'  // amber-400
                         :                 '#6ee7b7'; // emerald-300

          return (
            <div className="relative flex items-center gap-4 mb-4">
              {/* Gauge SVG */}
              <svg width="110" height="70" viewBox="0 0 110 70" className="flex-shrink-0">
                {/* Track */}
                <path d="M 10 65 A 45 45 0 0 1 100 65" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" strokeLinecap="round" />
                {/* Fill */}
                {!isEmpty && (
                  <path
                    d="M 10 65 A 45 45 0 0 1 100 65"
                    fill="none"
                    stroke={arcColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LEN}
                    strokeDashoffset={dashOffset}
                  />
                )}
                {/* Label */}
                <text x="55" y="45" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity={isEmpty ? 0.4 : 0.8}>
                  {isOver ? 'OVER BUDGET' : 'OF BUDGET'}
                </text>
                <text x="55" y="62" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" opacity={isEmpty ? 0.4 : 1}>
                  {isEmpty ? '—' : `${usedPct}%`}
                </text>
              </svg>

              {/* Metrics list */}
              <div className="flex-1 space-y-1.5" style={{ opacity: isEmpty ? 0.4 : 1 }}>
                {[
                  { label: 'Income',   value: incomeVal,   color: '#6ee7b7' },
                  { label: 'Expenses', value: expensesVal, color: '#f9a8d4' },
                  { label: 'Savings',  value: savingsVal,  color: '#c4b5fd' },
                  { label: 'Debt',     value: debtVal,     color: '#38bdf8' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-semibold">
                    <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-white/70 w-14 flex-shrink-0">{label}</span>
                    <span className="font-amount">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Net balance */}
        <div className="relative pt-3 border-t border-white/15 flex items-baseline justify-between">
          <span className="text-sm text-white/70">Net balance</span>
          <p className="font-amount font-extrabold tracking-tight leading-none whitespace-nowrap"
             style={{ fontSize: 'clamp(20px, 6vw, 28px)' }}>
            {netDisplay}
          </p>
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
              <p className={cn('font-amount text-base font-extrabold', meta.textClass)}>
                {formatCurrency(selected?.totalTracked ?? 0)}
              </p>
              <p className="font-amount text-xs text-muted-foreground tabular-nums">
                of {formatCurrency(selected?.totalBudget ?? 0)}
              </p>
            </div>
          </div>
          {/* Overall progress bar — keep the percentage here, not in the summary text above */}
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
                    <p className={cn('font-amount text-base font-bold leading-none tabular-nums', isOver ? 'text-expense' : 'text-foreground')}>
                      {item.tracked > 0 ? formatCurrency(item.tracked) : formatCurrency(0)}
                    </p>
                    <p className="font-amount mt-1 text-[11px] leading-none text-muted-foreground/85 tabular-nums">
                      of {formatCurrency(item.budget)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

        </CardContent>
      </Card>
    </div>
  );
}
