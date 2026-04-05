import { useState } from 'react';
import { MONTHS } from '@/shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardSummary } from './hooks';
import { useSettings } from '@/features/settings/hooks';
import BudgetBreakdown from './components/BudgetBreakdown';

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: summary } = useDashboardSummary(year, month);
  const { data: settings } = useSettings();

  const breakdown = summary?.breakdown ?? [];

  const currency = settings?.currency ?? '$';
  const formatCurrency = (val: number) => `${currency}${val.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Budget Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track your income, expenses, and savings</p>
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
          <Select value={month.toString()} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <BudgetBreakdown breakdown={breakdown} formatCurrency={formatCurrency} />
    </div>
  );
}
