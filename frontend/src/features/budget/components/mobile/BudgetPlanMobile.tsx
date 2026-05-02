import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../../types';
import { cn } from '@/lib/utils';
import { BudgetSectionMobile } from './BudgetSectionMobile';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

interface BudgetPlanMobileProps {
  year: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  typeTotals: Record<string, number[]>;
  toBeAllocated: number[];
  onAmountChange: (catId: string, month: number, value: string) => void;
  currency: string;
}

export function BudgetPlanMobile({
  year,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  categories,
  budgetPlans,
  typeTotals,
  toBeAllocated,
  onAmountChange,
  currency,
}: BudgetPlanMobileProps) {
  const [selectedType, setSelectedType] = useState<BudgetType>('Income');

  const fmt = (v: number) =>
    `${currency}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

  const remaining  = toBeAllocated[selectedMonth - 1];
  const incBudget  = typeTotals.Income?.[selectedMonth - 1]   ?? 0;
  const expBudget  = typeTotals.Expenses?.[selectedMonth - 1] ?? 0;
  const savBudget  = typeTotals.Savings?.[selectedMonth - 1]  ?? 0;
  const debtBudget = typeTotals.Debt?.[selectedMonth - 1]     ?? 0;
  const allocated  = expBudget + savBudget + debtBudget;
  const allocPct   = incBudget > 0 ? Math.round((allocated / incBudget) * 100) : 0;
  const isOver     = allocPct > 100;
  const isEmpty    = incBudget === 0 && allocated === 0;

  const ARC_LEN    = 141;
  const fillLen    = isEmpty ? 0 : Math.min(allocPct / 100, 1) * ARC_LEN;
  const dashOffset = ARC_LEN - fillLen;
  const arcColor   = isEmpty        ? 'rgba(255,255,255,0.25)'
                   : isOver         ? '#f9a8d4'
                   : allocPct >= 80 ? '#fbbf24'
                   :                  '#6ee7b7';

  const remainingColor = remaining < 0 ? '#f9a8d4' : remaining > 0 ? '#6ee7b7' : 'white';
  const remainingDisplay = remaining === 0
    ? '—'
    : remaining < 0 ? `-${fmt(Math.abs(remaining))}` : fmt(remaining);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      {/* Hero card */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden mb-4 shrink-0"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78ff 60%, #a99ef8 100%)' }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-6 left-4 w-24 h-24 rounded-full bg-white/[0.05]" />

        {/* Month navigation */}
        <div className="relative flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-0.5">
              Budget Plan
            </p>
            <p className="font-display text-lg font-bold">{MONTHS[selectedMonth - 1]} {year}</p>
          </div>
          <div className="flex items-center gap-0.5 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1.5">
            <button onClick={onPrevMonth} className="p-1 text-white/80 hover:text-white transition-colors" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={onNextMonth} className="p-1 text-white/80 hover:text-white transition-colors" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Arc + metrics */}
        <div className="relative flex items-center gap-4 mb-4">
          <svg width="110" height="70" viewBox="0 0 110 70" className="flex-shrink-0">
            <path d="M 10 65 A 45 45 0 0 1 100 65" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" strokeLinecap="round" />
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
            <text x="55" y="45" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity={isEmpty ? 0.4 : 0.8}>
              {isOver ? 'OVER' : 'ALLOCATED'}
            </text>
            <text x="55" y="62" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" opacity={isEmpty ? 0.4 : 1}>
              {isEmpty ? '—' : `${allocPct}%`}
            </text>
          </svg>

          <div className="flex-1 space-y-1.5" style={{ opacity: isEmpty ? 0.4 : 1 }}>
            {([
              { label: 'Income',   value: incBudget,  color: '#6ee7b7' },
              { label: 'Expenses', value: expBudget,  color: '#f9a8d4' },
              { label: 'Savings',  value: savBudget,  color: '#c4b5fd' },
              { label: 'Debt',     value: debtBudget, color: '#38bdf8' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-white/70 w-14 flex-shrink-0">{label}</span>
                <span className="font-amount">{fmt(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Remaining */}
        <div className="relative pt-3 border-t border-white/15 flex items-baseline justify-between">
          <span className="text-sm text-white/70">Remaining</span>
          <p
            className="font-amount font-extrabold tracking-tight leading-none whitespace-nowrap"
            style={{ fontSize: 'clamp(20px, 6vw, 28px)', color: remainingColor }}
          >
            {remainingDisplay}
          </p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 bg-card border border-border rounded-full p-1 shadow-sm mb-5">
        {BUDGET_TYPES.map(type => {
          const isActive = type === selectedType;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'flex-1 rounded-full px-2 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                isActive ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              style={isActive ? { background: `var(--budget-${type.toLowerCase()}-accent)` } : undefined}
            >
              {type}
            </button>
          );
        })}
      </div>

      <BudgetSectionMobile
        type={selectedType}
        categories={categories}
        budgetPlans={budgetPlans}
        onAmountChange={onAmountChange}
        currency={currency}
        month={selectedMonth}
      />
    </div>
  );
}
