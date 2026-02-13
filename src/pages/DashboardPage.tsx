import { useMemo, useState } from 'react';
import { MONTHS, BudgetType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useDashboardSummary, useMonthlyComparison } from '@/hooks/api/useDashboard';
import { useSettings } from '@/hooks/api/useSettings';

const PIE_COLORS = [
  'hsl(217, 71%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)', 'hsl(190, 80%, 45%)',
  'hsl(340, 75%, 55%)', 'hsl(160, 60%, 40%)',
];

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: summary } = useDashboardSummary(year, month);
  const { data: monthlyComparison } = useMonthlyComparison(year);
  const { data: settings } = useSettings();

  const breakdown = summary?.breakdown ?? [];
  const incomeData = breakdown.find(b => b.type === 'Income');
  const expenseData = breakdown.find(b => b.type === 'Expenses');
  const savingsData = breakdown.find(b => b.type === 'Savings');
  const debtData = breakdown.find(b => b.type === 'Debt');

  const totalIncome = incomeData?.totalTracked ?? 0;
  const totalExpenses = expenseData?.totalTracked ?? 0;
  const totalSavings = savingsData?.totalTracked ?? 0;
  const totalDebt = debtData?.totalTracked ?? 0;

  // Monthly comparison chart data
  const monthlyData = useMemo(() => {
    if (!monthlyComparison) return [];
    return monthlyComparison.months.map(m => ({
      month: m.monthName,
      Income: m.income,
      Expenses: m.expenses,
    }));
  }, [monthlyComparison]);

  // Expense allocation pie
  const expensePie = useMemo(() => {
    if (!expenseData) return [];
    const groups: Record<string, number> = {};
    expenseData.items.forEach(i => {
      groups[i.group] = (groups[i.group] ?? 0) + i.tracked;
    });
    return Object.entries(groups).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [expenseData]);

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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-income" /> Income
            </div>
            <p className="stat-value amount-positive">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4 text-expense" /> Expenses
            </div>
            <p className="stat-value amount-negative">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4 text-savings" /> Savings
            </div>
            <p className="stat-value text-savings">{formatCurrency(totalSavings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Wallet className="h-4 w-4 text-debt" /> Debt Payments
            </div>
            <p className="stat-value text-debt">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Breakdown tables */}
        <Card>
          <CardHeader><CardTitle className="font-display">Breakdown — {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {breakdown.map(section => (
              <div key={section.type}>
                <h3 className={`text-sm font-semibold mb-2 text-${section.type === 'Income' ? 'income' : section.type === 'Expenses' ? 'expense' : section.type === 'Savings' ? 'savings' : 'debt'}`}>
                  {section.type}
                </h3>
                <div className="space-y-2">
                  {section.items.filter(i => i.budget > 0 || i.tracked > 0).map(item => (
                    <div key={item.categoryId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{item.categoryName}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.tracked)} / {formatCurrency(item.budget)}
                          <span className="ml-2 font-medium">{item.percentage}%</span>
                        </span>
                      </div>
                      <Progress value={Math.min(item.percentage, 100)} className="h-1.5" />
                    </div>
                  ))}
                  {section.items.filter(i => i.budget > 0 || i.tracked > 0).length === 0 && (
                    <p className="text-xs text-muted-foreground">No data for this period</p>
                  )}
                </div>
                <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(section.totalTracked)} / {formatCurrency(section.totalBudget)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display">Income vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display">Expense Allocation</CardTitle></CardHeader>
            <CardContent>
              {expensePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={expensePie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expensePie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">No expense data for this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
