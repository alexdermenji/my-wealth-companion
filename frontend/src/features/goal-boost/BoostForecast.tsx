import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { budgetPlansApi } from '@/features/budget/api';
import {
  useNetWorthItems,
  useAllNetWorthValues,
} from '@/features/net-worth/hooks';
import { comparePayoff, type BoostGoal } from './model';
import { useBoostCommand } from './hooks';
import { selectForecastSources } from './sources';
import { selectClass } from './BoostEntryForm';
export function BoostForecast({
  goal,
  available,
  currency,
}: {
  goal: BoostGoal;
  available: number;
  currency: string;
}) {
  const { data: items = [] } = useNetWorthItems();
  const { data: values = [] } = useAllNetWorthValues();
  const now = new Date();
  const budget = useQuery({
    queryKey: ['budget-plans', now.getFullYear()],
    queryFn: () => budgetPlansApi.getByYear(now.getFullYear()),
  });
  const sources = selectForecastSources(
    goal.category_id,
    items,
    values,
    budget.data ?? [],
    now,
  );
  const planned = sources.payment;
  const [balance, setBalance] = useState<string | null>(null),
    [payment, setPayment] = useState<string | null>(null);
  const [rate, setRate] = useState(String(goal.settings.rate ?? ''));
  const [debtType, setDebtType] = useState(goal.settings.debtType ?? 'loan');
  const [extra, setExtra] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const b = balance ?? String(sources.balance ?? goal.settings.balance ?? '');
  const p = payment ?? String(planned ?? goal.settings.payment ?? '');
  const x = extra ?? String(Math.min(available, Math.max(0, Number(b))));
  let result: ReturnType<typeof comparePayoff> | undefined,
    problem = '';
  try {
    if (b !== '' && p !== '' && rate !== '')
      result = comparePayoff(
        { balance: Number(b), payment: Number(p), rate: Number(rate) },
        Number(x),
      );
  } catch (err) {
    problem = (err as Error).message;
  }
  const command = useBoostCommand();
  async function save() {
    try {
      await command.mutateAsync({
        action: 'settings',
        data: {
          goalId: goal.id,
          settings: {
            debtType,
            balance: Number(b),
            payment: Number(p),
            rate: Number(rate),
          },
        },
      });
      setMessage('Forecast settings saved.');
    } catch (err) {
      setMessage((err as Error).message);
    }
  }
  const money = (n: number) =>
    `${currency}${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div className="space-y-4">
      <label className="grid gap-1 text-sm">
        Debt type
        <select
          className={selectClass}
          value={debtType}
          onChange={(e) => setDebtType(e.target.value as typeof debtType)}
        >
          <option value="loan">Loan</option>
          <option value="card">Credit card</option>
          <option value="mortgage">Mortgage</option>
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          Current debt balance ({currency})
          <Input
            type="number"
            min="0"
            step="0.01"
            value={b}
            onChange={(e) => setBalance(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Annual interest rate (%)
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Monthly payment ({currency})
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={p}
            onChange={(e) => setPayment(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Extra payment today ({currency})
          <Input
            type="number"
            min="0"
            max={Number(b)}
            step="0.01"
            value={x}
            onChange={(e) => setExtra(e.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        {balance !== null
          ? 'Balance entered manually.'
          : sources.balanceDate
            ? `Net Worth: ${sources.itemName}, snapshot ${sources.balanceDate}. Confirm this is your current balance.`
            : sources.ambiguous
              ? 'Multiple linked debts: enter the balance for the debt you want to repay.'
              : 'No current linked snapshot. Confirm or enter your current debt balance.'}{' '}
        {payment !== null
          ? 'Payment entered manually.'
          : planned != null
            ? `Payment from ${format(now, 'MMMM yyyy')} budget.`
            : 'Enter or confirm your monthly payment.'}
      </p>
      {problem && (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      )}
      {result && (
        <div
          className="rounded-xl bg-primary/5 p-4 space-y-3"
          aria-live="polite"
        >
          <div>
            <p className="text-sm text-muted-foreground">
              Estimated future interest saved
            </p>
            <p className="text-3xl font-amount font-bold text-primary">
              {money(result.saved)}
            </p>
          </div>
          <p className="font-medium">{result.monthsSaved} months sooner</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              Without extra payment
              <p className="font-medium">
                {result.before.months} months ·{' '}
                {format(addMonths(now, result.before.months), 'MMM yyyy')}
              </p>
              <p>{money(result.before.interest)} interest</p>
            </div>
            <div>
              With extra payment
              <p className="font-medium">
                {result.after.months} months ·{' '}
                {format(addMonths(now, result.after.months), 'MMM yyyy')}
              </p>
              <p>{money(result.after.interest)} interest</p>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Estimate only: fixed nominal annual rate divided by 12, monthly
        interest, unchanged payment, no new borrowing and no fees. Your lender’s
        calculation may differ. Future interest saved is not added to Goal
        Boost. These inputs do not change your budget or Net Worth.
      </p>
      <Button disabled={!result || command.isPending} onClick={save}>
        {command.isPending ? 'Saving…' : 'Save forecast settings'}
      </Button>
      <p className="text-sm" role="status">
        {message}
      </p>
    </div>
  );
}
