import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BudgetTypeBreakdown } from '../types';

// All values reference theme CSS variables — no hardcoded colours.
// accentVar: used for SVG strokes and borders (can't use Tailwind classes there).
// bgClass / textClass: Tailwind tokens from tailwind.config.ts → budget.{type}.{header|text}.
const TYPE_STYLES: Record<string, { accentVar: string; bgClass: string; textClass: string }> = {
  Income:   { accentVar: 'var(--budget-income-accent)',   bgClass: 'bg-budget-income-header',   textClass: 'text-budget-income-text' },
  Expenses: { accentVar: 'var(--budget-expenses-accent)', bgClass: 'bg-budget-expenses-header', textClass: 'text-budget-expenses-text' },
  Savings:  { accentVar: 'var(--budget-savings-accent)',  bgClass: 'bg-budget-savings-header',  textClass: 'text-budget-savings-text' },
  Debt:     { accentVar: 'var(--budget-debt-accent)',     bgClass: 'bg-budget-debt-header',     textClass: 'text-budget-debt-text' },
};

function ProgressRing({ pct, accentVar }: { pct: number; accentVar: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width="44" height="44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="3.5" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke={accentVar} strokeWidth="3.5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 22 22)"
      />
      <text x="22" y="26.5" textAnchor="middle" fontSize="10" fontWeight="700" fill={accentVar}>
        {Math.min(pct, 100)}%
      </text>
    </svg>
  );
}

function pctColorClass(pct: number): string {
  if (pct === 0)   return 'text-muted-foreground';
  if (pct > 100)   return 'text-expense font-semibold';
  if (pct === 100) return 'text-emerald-500 font-medium';
  if (pct >= 75)   return 'text-amber-500 font-medium';
  return 'text-foreground';
}

interface Props {
  breakdown: BudgetTypeBreakdown[];
  formatCurrency: (v: number) => string;
}

export default function BudgetBreakdown({ breakdown, formatCurrency }: Props) {
  const [selectedType, setSelectedType] = useState(() => breakdown[0]?.type ?? 'Income');

  const selected = breakdown.find(b => b.type === selectedType) ?? breakdown[0];
  const meta = TYPE_STYLES[selectedType] ?? TYPE_STYLES['Income'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', alignItems: 'start' }}>
      {/* Left — Navigator */}
      <div className="flex flex-col gap-3">
        {breakdown.map(section => {
          const m = TYPE_STYLES[section.type] ?? TYPE_STYLES['Income'];
          const pct = section.totalBudget > 0
            ? Math.floor(section.totalTracked / section.totalBudget * 100)
            : 0;
          const isActive = section.type === selectedType;

          return (
            <button
              key={section.type}
              onClick={() => setSelectedType(section.type)}
              style={{
                borderLeft: `${isActive ? 4 : 3}px solid ${m.accentVar}`,
                transform: isActive ? 'translateX(2px)' : 'none',
                transition: 'all 0.15s ease',
              }}
              className={`w-full text-left rounded-lg border border-border p-3 cursor-pointer ${isActive ? m.bgClass : 'bg-card'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-widest ${m.textClass}`}>
                  {section.type}
                </span>
                <ProgressRing pct={pct} accentVar={m.accentVar} />
              </div>
              <div className="font-bold text-foreground text-lg leading-none mb-0.5">
                {formatCurrency(section.totalTracked)}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                of {formatCurrency(section.totalBudget)} budgeted
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-border">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%`, background: m.accentVar, transition: 'width 0.3s' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Right — Detail panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`font-display ${meta.textClass}`}>
              {selected?.type}
            </CardTitle>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>
                Tracked:{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(selected?.totalTracked ?? 0)}
                </span>
              </span>
              <span>
                Budget:{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(selected?.totalBudget ?? 0)}
                </span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tracked
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Budget
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ minWidth: 160 }}>
                  Progress
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Remaining
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Excess
                </th>
              </tr>
            </thead>
            <tbody>
              {selected?.items.filter(i => i.budget > 0 || i.tracked > 0).slice().sort((a, b) => b.percentage - a.percentage || b.tracked - a.tracked).map(item => {
                const remaining = item.budget > item.tracked ? item.budget - item.tracked : 0;
                const excess = item.tracked > item.budget && item.budget > 0 ? item.tracked - item.budget : 0;
                return (
                  <tr key={item.categoryId} className="border-b last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-2.5 text-foreground">{item.categoryName}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                      {item.tracked > 0 ? formatCurrency(item.tracked) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                      {item.budget > 0 ? formatCurrency(item.budget) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(item.percentage, 100)} className="h-1.5 flex-1" />
                        <span className={`text-xs tabular-nums w-9 text-right ${pctColorClass(item.percentage)}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {remaining > 0
                        ? <span className="text-foreground">{formatCurrency(remaining)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {excess > 0
                        ? <span className="font-semibold text-expense">{formatCurrency(excess)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
              {selected?.items.filter(i => i.budget > 0 || i.tracked > 0).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No data for this period
                  </td>
                </tr>
              )}
            </tbody>
            {(selected?.items.filter(i => i.budget > 0 || i.tracked > 0).length ?? 0) > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-secondary">
                  <td className="px-4 py-2.5 font-bold text-foreground">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums text-foreground">
                    {formatCurrency(selected?.totalTracked ?? 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums text-foreground">
                    {formatCurrency(selected?.totalBudget ?? 0)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={selected && selected.totalBudget > 0
                          ? Math.min(Math.floor(selected.totalTracked / selected.totalBudget * 100), 100)
                          : 0}
                        className="h-1.5 flex-1"
                      />
                      <span className={`text-xs tabular-nums w-9 text-right ${pctColorClass(selected && selected.totalBudget > 0 ? Math.floor(selected.totalTracked / selected.totalBudget * 100) : 0)}`}>
                        {selected && selected.totalBudget > 0
                          ? `${Math.floor(selected.totalTracked / selected.totalBudget * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums text-foreground">
                    {selected && selected.totalBudget > selected.totalTracked
                      ? formatCurrency(selected.totalBudget - selected.totalTracked)
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                    {selected && selected.totalTracked > selected.totalBudget && selected.totalBudget > 0
                      ? <span className="text-expense">{formatCurrency(selected.totalTracked - selected.totalBudget)}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
