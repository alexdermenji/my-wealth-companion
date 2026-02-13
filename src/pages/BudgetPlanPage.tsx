import { useState } from 'react';
import { MONTHS, BudgetType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories } from '@/hooks/api/useCategories';
import { useBudgetPlans, useSetBudgetAmount } from '@/hooks/api/useBudgetPlans';
import { useSettings } from '@/hooks/api/useSettings';

export default function BudgetPlanPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeType, setActiveType] = useState<BudgetType>('Expenses');

  const { data: allCategories = [] } = useCategories();
  const { data: budgetPlans = [] } = useBudgetPlans(year);
  const { data: settings } = useSettings();
  const setBudgetAmountMutation = useSetBudgetAmount();

  const categories = allCategories.filter(c => c.type === activeType);

  // Group categories
  const groups = categories.reduce<Record<string, typeof categories>>((acc, cat) => {
    (acc[cat.group] = acc[cat.group] || []).push(cat);
    return acc;
  }, {});

  const getBudgetAmount = (catId: string, month: number): number => {
    const plan = budgetPlans.find(bp => bp.categoryId === catId);
    return plan?.months[month] ?? 0;
  };

  const handleChange = (catId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setBudgetAmountMutation.mutate({ categoryId: catId, year, month, amount: num });
  };

  const getMonthTotal = (month: number) => {
    return categories.reduce((s, c) => s + getBudgetAmount(c.id, month), 0);
  };

  const getYearTotal = (catId: string) => {
    return Array.from({ length: 12 }, (_, i) => getBudgetAmount(catId, i + 1)).reduce((a, b) => a + b, 0);
  };

  const currency = settings?.currency ?? '$';
  const formatCurrency = (v: number) => v > 0 ? `${currency}${v.toLocaleString()}` : '-';

  const types: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Budget Planning</h1>
          <p className="text-muted-foreground text-sm">Set monthly budgets for each category</p>
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

      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeType === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[150px]">Category</TableHead>
                {MONTHS.map((m, i) => (
                  <TableHead key={i} className="text-center min-w-[90px]">{m}</TableHead>
                ))}
                <TableHead className="text-center font-semibold min-w-[100px]">{year} Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groups).map(([group, cats]) => (
                <>
                  <TableRow key={`g-${group}`} className="bg-muted/50">
                    <TableCell colSpan={14} className="font-semibold text-sm text-muted-foreground">
                      {group}
                    </TableCell>
                  </TableRow>
                  {cats.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="sticky left-0 bg-card z-10 text-sm font-medium">{cat.name}</TableCell>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => {
                        const val = getBudgetAmount(cat.id, mo);
                        return (
                          <TableCell key={mo} className="p-1">
                            <Input
                              type="number"
                              className="h-8 text-sm text-center w-20"
                              value={val || ''}
                              placeholder="0"
                              onChange={e => handleChange(cat.id, mo, e.target.value)}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-medium text-sm">
                        {formatCurrency(getYearTotal(cat.id))}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              <TableRow className="border-t-2 font-bold">
                <TableCell className="sticky left-0 bg-card z-10">Total</TableCell>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
                  <TableCell key={mo} className="text-center text-sm">
                    {formatCurrency(getMonthTotal(mo))}
                  </TableCell>
                ))}
                <TableCell className="text-center text-sm">
                  {formatCurrency(Array.from({ length: 12 }, (_, i) => getMonthTotal(i + 1)).reduce((a, b) => a + b, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
