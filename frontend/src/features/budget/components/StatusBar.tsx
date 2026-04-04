interface StatusBarProps {
  typeTotals: Record<string, number[]>;
  currency?: string;
}

const SECTION_ITEMS = [
  { key: 'Income',   label: 'Income',      color: 'hsl(var(--income))'   },
  { key: 'Expenses', label: 'Expenses',    color: 'hsl(var(--expense))'  },
  { key: 'Savings',  label: 'Savings',     color: 'hsl(var(--savings))'  },
  { key: 'Debt',     label: 'Liabilities', color: 'hsl(var(--debt))'     },
] as const;

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function fmt(value: number, currency: string): string {
  return `${currency}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export function StatusBar({ typeTotals, currency = '£' }: StatusBarProps) {
  const incomeAvg = avg(typeTotals.Income ?? []);
  const outflowAvg = avg(typeTotals.Expenses ?? []) + avg(typeTotals.Savings ?? []) + avg(typeTotals.Debt ?? []);
  const netAvg = incomeAvg - outflowAvg;
  const netPositive = netAvg >= 0;

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-border bg-card px-5 py-3.5 shadow-sm shrink-0">
      {SECTION_ITEMS.map(({ key, label, color }, i) => {
        const value = avg(typeTotals[key] ?? []);
        return (
          <div key={key} className="flex items-center gap-5">
            {i > 0 && <div className="h-5 w-px bg-border" />}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-display text-sm font-bold" style={{ color }}>{fmt(value, currency)}/mo</span>
            </div>
          </div>
        );
      })}
      <div className="h-5 w-px bg-border" />
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Net remaining (avg)</span>
        <span
          className="font-display text-sm font-bold"
          style={{ color: netPositive ? 'hsl(var(--success))' : 'hsl(var(--expense))' }}
        >
          {fmt(Math.abs(netAvg), currency)}/mo {netPositive ? '↑' : '↓'}
        </span>
      </div>
    </div>
  );
}
