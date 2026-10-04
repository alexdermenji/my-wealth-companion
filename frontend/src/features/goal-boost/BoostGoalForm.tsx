import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBoostCommand } from './hooks';
import { type BoostEntry, type BoostGoal } from './model';
import {
  goalInterest,
  validateDebtSettings,
  type DebtSettings,
} from './interest';
import { selectClass } from './BoostEntryForm';

export function BoostGoalForm({
  goal,
  entries,
  currency,
  onDone,
  onSaving,
}: {
  goal?: BoostGoal;
  entries: BoostEntry[];
  currency: string;
  onDone: () => void;
  onSaving: (value: boolean) => void;
}) {
  const { data: categories = [] } = useCategories();
  const [category, setCategory] = useState(goal?.category_id ?? '');
  const [error, setError] = useState('');
  const command = useBoostCommand();
  const selected = categories.find((c) => c.id === category);
  const sameGoal = category === goal?.category_id ? goal : undefined;
  const previous = entries
    .filter((e) => e.kind === 'contribution' && e.goal_id === sameGoal?.id)
    .map((e) => e.date)
    .sort()[0];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    let settings: DebtSettings | undefined;
    try {
      if (selected?.type === 'Debt') {
        settings = {
          version: 2,
          debtType: String(
            form.get('debtType'),
          ) as DebtSettings['debtType'],
          balance: Number(form.get('balance')),
          rate: Number(form.get('rate')),
          payment: Number(form.get('payment')),
          balanceDate: String(form.get('balanceDate')),
          nextPaymentDate: String(form.get('nextPaymentDate')),
        };
        validateDebtSettings(settings);
        if (sameGoal) {
          const projection = goalInterest(
            { ...sameGoal, settings },
            entries,
          );
          if (projection.error) throw new Error(projection.error);
        }
      }
      onSaving(true);
      await command.mutateAsync({
        action: 'save-goal',
        data: { categoryId: category, settings },
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      onSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={command.isPending} className="space-y-4 min-w-0">
        <label className="grid gap-1.5 text-sm">
          Budget category
          <select
            className={selectClass}
            required
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setError('');
            }}
          >
            <option value="">Choose a category</option>
            {categories
              .filter((c) => c.type === 'Debt' || c.type === 'Savings')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.type}
                </option>
              ))}
          </select>
        </label>
        {selected?.type === 'Debt' && (
          <DebtFields
            key={category}
            goal={sameGoal}
            previous={previous}
            currency={currency}
          />
        )}
        <Link
          className="block text-sm text-primary underline"
          to="/budget"
          onClick={onDone}
        >
          Add a category in Budget Plan
        </Link>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button disabled={command.isPending} type="submit">
          {command.isPending ? 'Saving…' : 'Save goal'}
        </Button>
      </fieldset>
    </form>
  );
}

function DebtFields({
  goal,
  previous,
  currency,
}: {
  goal?: BoostGoal;
  previous?: string;
  currency: string;
}) {
  // Legacy forecast inputs may include future interest or a budget allocation.
  // Only explicitly confirmed v2 inputs are restored, never inferred from Net Worth.
  const settings = goal?.settings.version === 2 ? goal.settings : undefined;
  const date =
    settings?.balanceDate ?? previous ?? format(new Date(), 'yyyy-MM-dd');
  return (
    <div className="space-y-3">
      <label className="grid gap-1.5 text-sm">
        Debt type
        <select
          className={selectClass}
          name="debtType"
          defaultValue={settings?.debtType ?? 'loan'}
        >
          <option value="loan">Loan</option>
          <option value="card">Credit card</option>
          <option value="mortgage">Mortgage</option>
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm">
          Principal balance ({currency})
          <Input
            required
            name="balance"
            type="number"
            min="0.01"
            max="10000000000"
            step="0.01"
            defaultValue={settings?.balance ?? ''}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Annual interest rate (%)
          <Input
            required
            name="rate"
            type="number"
            min="0"
            max="100"
            step="any"
            defaultValue={settings?.rate ?? ''}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Monthly payment ({currency})
          <Input
            required
            name="payment"
            type="number"
            min="0.01"
            max="1000000000000"
            step="0.01"
            defaultValue={settings?.payment ?? ''}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Balance date
          <Input
            required
            name="balanceDate"
            type="date"
            max={previous ?? format(new Date(), 'yyyy-MM-dd')}
            defaultValue={date}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Next monthly payment date
          <Input
            required
            name="nextPaymentDate"
            type="date"
            defaultValue={
              settings?.nextPaymentDate ??
              format(addMonths(parseISO(date), 1), 'yyyy-MM-dd')
            }
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter the principal owed before your first included contribution,
        excluding future interest, and the contractual monthly payment. Use
        the interest rate, not APR. Do not include extra repayments in the
        monthly payment.
      </p>
      {previous && (
        <p className="text-sm">
          Your previous contributions will be included, starting {previous}.
          Use a balance from that date or earlier, before those extra
          payments.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Estimates assume a fixed rate, monthly interest, an unchanged
        monthly payment and a shorter term, with no fees or new borrowing.
        Monthly payments happen before contributions on the same date.
        Editing these details recalculates the estimates; your budget and
        Net Worth stay unchanged.
      </p>
    </div>
  );
}
