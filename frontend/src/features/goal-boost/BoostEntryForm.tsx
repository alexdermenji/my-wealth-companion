import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccounts } from '@/shared/hooks/useAccounts';
import { useCategories } from '@/shared/hooks/useCategories';
import { transactionsApi } from '@/features/transactions/api';
import { useBoostCommand } from './hooks';
import { cents, type BoostEntry, type BoostGoal } from './model';
import { goalInterest } from './interest';

export const selectClass =
  'flex h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm';
const fieldClass = 'grid gap-1.5 text-sm';
interface Props {
  goal?: BoostGoal;
  entries: BoostEntry[];
  editing?: BoostEntry;
  contribution: boolean;
  available: number;
  currency: string;
  onDone: () => void;
  onSaving: (saving: boolean) => void;
}
export function BoostEntryForm({
  goal,
  entries,
  editing,
  contribution,
  available,
  currency,
  onDone,
  onSaving,
}: Props) {
  const [mode, setMode] = useState(
    editing?.face_value ? 'voucher' : 'saved',
  );
  const [source, setSource] = useState('existing');
  const [id] = useState(() => editing?.id ?? crypto.randomUUID());
  const [date, setDate] = useState(
    editing?.date ?? format(new Date(), 'yyyy-MM-dd'),
  );
  const [description, setDescription] = useState(
    editing?.description ?? '',
  );
  const [amount, setAmount] = useState(
    editing ? String(editing.amount) : '',
  );
  const [face, setFace] = useState(
    editing?.face_value ? String(editing.face_value) : '',
  );
  const [paid, setPaid] = useState(
    editing?.paid != null ? String(editing.paid) : '',
  );
  const [txId, setTxId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const command = useBoostCommand();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const linked = contribution || mode === 'received';
  const type = contribution ? goal?.kind : 'Income';
  const txs = useQuery({
    queryKey: ['transactions', 'boost-picker', type, page],
    queryFn: () =>
      transactionsApi.getPage({ budgetType: type, page, pageSize: 25 }),
    enabled: linked && source === 'existing',
  });
  const remaining = (tx: { id: string; amount: number }) =>
    (cents(Math.abs(tx.amount)) -
      entries
        .filter((e) => e.transaction_id === tx.id)
        .reduce((n, e) => n + cents(e.amount), 0)) /
    100;
  const eligible = (txs.data?.transactions ?? []).filter(
    (t) =>
      !t.transferPairId &&
      t.date <= format(new Date(), 'yyyy-MM-dd') &&
      remaining(t) > 0 &&
      (contribution
        ? t.budgetPositionId === goal?.category_id &&
          (goal?.kind === 'Debt' ? t.amount < 0 : t.amount > 0)
        : t.amount > 0),
  );
  const value =
    mode === 'voucher' && !contribution
      ? (cents(Number(face)) - cents(Number(paid))) / 100
      : Number(amount);
  const contributionDate =
    source === 'existing'
      ? eligible.find((tx) => tx.id === txId)?.date
      : date;
  const projection =
    contribution && goal?.kind === 'Debt' && value > 0 && contributionDate
      ? goalInterest(goal, [
          ...entries,
          {
            id,
            kind: 'contribution',
            amount: value,
            date: contributionDate,
            goal_id: goal.id,
          } as BoostEntry,
        ])
      : undefined;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      (contribution && value > available)
    ) {
      setError('Enter a positive amount within the available balance.');
      return;
    }
    onSaving(true);
    try {
      await command.mutateAsync({
        action: editing ? 'edit' : 'add',
        data: {
          id,
          kind: contribution
            ? 'contribution'
            : linked
              ? 'received'
              : 'saved',
          amount: value,
          description,
          date,
          faceValue:
            !contribution && mode === 'voucher' ? Number(face) : null,
          paid: !contribution && mode === 'voucher' ? Number(paid) : null,
          goalId: goal?.id,
          transactionId: source === 'existing' && linked ? txId : null,
          accountId,
          categoryId,
          transactionAmount: Number(txAmount),
        },
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
        {!contribution && (
          <label className={fieldClass}>
            Boost type
            <select
              className={selectClass}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setTxId('');
                setPage(1);
              }}
            >
              <option value="saved">I saved — enter an amount</option>
              <option value="voucher">I saved — voucher discount</option>
              {!editing && (
                <option value="received">
                  I received unexpected money
                </option>
              )}
            </select>
          </label>
        )}
        {linked && (
          <>
            <label className={fieldClass}>
              Transaction source
              <select
                className={selectClass}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="existing">
                  Link an existing transaction
                </option>
                <option value="new">Record a new transaction</option>
              </select>
            </label>
            {source === 'existing' ? (
              <>
                <label className={fieldClass}>
                  Transaction
                  <select
                    className={selectClass}
                    required
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                  >
                    <option value="">Choose a transaction</option>
                    {eligible.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.date} · {t.details || type} · {currency}
                        {remaining(t).toFixed(2)} available
                      </option>
                    ))}
                  </select>
                </label>
                {txs.isLoading && (
                  <p className="text-sm">Loading transactions…</p>
                )}
                {txs.isError && (
                  <p role="alert" className="text-destructive">
                    Could not load transactions.{' '}
                    <button type="button" onClick={() => txs.refetch()}>
                      Retry
                    </button>
                  </p>
                )}
                {!txs.isLoading &&
                  !txs.isError &&
                  eligible.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No eligible transactions on this page. Try another
                      page or record a new transaction.
                    </p>
                  )}
                {(txs.data?.totalCount ?? 0) > 25 && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => {
                        setPage(page - 1);
                        setTxId('');
                      }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">Page {page}</span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={page * 25 >= (txs.data?.totalCount ?? 0)}
                      onClick={() => {
                        setPage(page + 1);
                        setTxId('');
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className={fieldClass}>
                  Account
                  <select
                    className={selectClass}
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  >
                    <option value="">Choose account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!contribution && (
                  <label className={fieldClass}>
                    Income category
                    <select
                      className={selectClass}
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Choose category</option>
                      {categories
                        .filter((c) => c.type === 'Income')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <label className={fieldClass}>
                  Full transaction amount ({currency})
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                  />
                </label>
              </>
            )}
          </>
        )}
        {(!linked || source === 'new') && (
          <>
            <label className={fieldClass}>
              Description
              <Input
                required
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Asda voucher"
              />
            </label>
            <label className={fieldClass}>
              Date
              <Input
                type="date"
                required
                max={format(new Date(), 'yyyy-MM-dd')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          </>
        )}
        {mode === 'voucher' && !contribution ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className={fieldClass}>
                Voucher value ({currency})
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={face}
                  onChange={(e) => setFace(e.target.value)}
                />
              </label>
              <label className={fieldClass}>
                Amount paid ({currency})
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </label>
            </div>
            <p className="text-primary font-medium" aria-live="polite">
              Saved: {currency}
              {Number.isFinite(value) ? value.toFixed(2) : '0.00'}
              {Number(face) > 0
                ? ` (${((value / Number(face)) * 100).toFixed(1)}%)`
                : ''}
            </p>
          </>
        ) : (
          <label className={fieldClass}>
            {linked ? 'Amount allocated to Goal Boost' : 'Amount saved'} (
            {currency})
            <Input
              type="number"
              min="0.01"
              step="0.01"
              max={contribution ? available : undefined}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        )}
        <p className="text-xs text-muted-foreground">
          {contribution
            ? `Available: ${currency}${available.toFixed(2)}. Record a payment already made; this does not send money.`
            : linked
              ? 'Only the allocated part counts towards your goal. Existing income is not recorded twice.'
              : 'Savings do not create income or change your account balance.'}
        </p>
        {projection && (
          <p className="text-sm text-primary" aria-live="polite">
            {projection.error
              ? `Interest estimate unavailable: ${projection.error}`
              : `Estimated interest saved by this contribution: ${currency}${projection.byEntry[id].toFixed(2)}`}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full">
          {command.isPending
            ? 'Saving…'
            : editing
              ? 'Save changes'
              : contribution
                ? 'Record contribution'
                : 'Save boost'}
        </Button>
      </fieldset>
    </form>
  );
}
