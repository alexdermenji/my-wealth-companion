import { useState } from 'react';
import { format } from 'date-fns';
import {
  Rocket,
  Plus,
  Target,
  ArrowUpRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSettings } from '@/features/settings/hooks';
import { useGoalBoost, useBoostCommand } from './hooks';
import { summarize, type BoostEntry } from './model';
import { BoostEntryForm, selectClass } from './BoostEntryForm';
import { interestSummary } from './interest';
import { BoostGoalForm } from './BoostGoalForm';
export function GoalBoostCard() {
  const query = useGoalBoost(),
    command = useBoostCommand();
  const { data: settings } = useSettings();
  const [panel, setPanel] = useState<
    'add' | 'contribute' | 'history' | 'goal' | null
  >(null);
  const [editing, setEditing] = useState<BoostEntry>();
  const [period, setPeriod] = useState('all');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<BoostEntry>();
  const entries = query.data?.entries ?? [],
    goals = query.data?.goals ?? [];
  const goal = goals.find((g) => g.active),
    totals = summarize(entries);
  const interest = interestSummary(goals, entries);
  const currency = settings?.currency ?? '£',
    money = (n: number) =>
      `${currency}${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const history =
    period === 'month'
      ? entries.filter((e) =>
          e.date.startsWith(format(new Date(), 'yyyy-MM')),
        )
      : entries;
  const filtered = summarize(history);
  function open(next: typeof panel) {
    setError('');
    setEditing(undefined);
    setRemoving(undefined);
    setPanel(next);
  }
  async function remove() {
    if (!removing) return;
    try {
      await command.mutateAsync({
        action: 'remove',
        data: { id: removing.id },
      });
      setRemoving(undefined);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const label =
    panel === 'add'
      ? editing
        ? 'Edit saving'
        : 'Add a boost'
      : panel === 'contribute'
        ? 'Record contribution'
        : panel === 'goal'
          ? 'Choose your goal'
          : 'Goal Boost history';
  return (
    <section
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      aria-label="Goal Boost"
    >
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-lg font-bold flex items-center gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Rocket className="h-5 w-5" />
            </span>
            Goal Boost
          </h2>
          <span className="text-xs text-muted-foreground">All time</span>
        </div>
        {query.isLoading ? (
          <p role="status">Loading your boosts…</p>
        ) : query.isError ? (
          <div role="alert">
            <p>Could not load Goal Boost.</p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">
                Available for your goal
              </p>
              <p
                className="text-4xl font-amount font-bold tracking-tight mt-1"
                data-testid="boost-available"
              >
                {money(totals.available)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Small savings. Unexpected money. More progress.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-y py-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Saved & received
                </p>
                <p className="font-amount text-lg font-semibold">
                  {money(totals.saved + totals.received)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Put towards goals
                </p>
                <p className="font-amount text-lg font-semibold">
                  {money(totals.contributed)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Your goal</p>
                <p className="font-medium break-words">
                  {goal?.name ?? 'Choose where your boosts will go'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => open('goal')}
              >
                {goal ? 'Change' : 'Choose'}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => open('add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add a boost
              </Button>
              <Button
                variant="outline"
                disabled={!goal || totals.available <= 0}
                onClick={() => open('contribute')}
              >
                {goal?.kind === 'Debt'
                  ? 'Record repayment'
                  : 'Record contribution'}
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            {(goal?.kind === 'Debt' ||
              interest.configured ||
              interest.missingGoals.length > 0) && (
              <div
                className="rounded-xl bg-primary/5 p-4 space-y-2"
                aria-live="polite"
              >
                <p className="text-sm text-muted-foreground">
                  Estimated interest saved
                </p>
                <p
                  className="text-3xl font-amount font-bold text-primary"
                  data-testid="boost-interest"
                >
                  {interest.configured ? money(interest.saved) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  From recorded extra repayments across your debt goals.
                  This is projected interest avoided, not money available to
                  spend.
                </p>
                {interest.missingGoals.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Some repayments are not included. Check debt details
                    for:{' '}
                    {interest.missingGoals.map((g) => g.name).join(', ')}.
                  </p>
                )}
                {goal?.kind === 'Debt' &&
                  interest.byGoal[goal.id]?.error && (
                    <p className="text-sm">
                      {interest.byGoal[goal.id].error}
                    </p>
                  )}
                {goal?.kind === 'Debt' && (
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => open('goal')}
                  >
                    {goal.settings.version === 2
                      ? 'Edit debt details'
                      : 'Set up interest savings'}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {!query.isError && (
        <div className="border-t px-5 sm:px-6 py-4 bg-secondary/20">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Recent activity
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => open('history')}
            >
              View all
            </Button>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">
              Add your first saving or unexpected income.
            </p>
          ) : (
            entries.slice(0, 3).map((e) => (
              <div key={e.id} className="flex justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words">
                    {e.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.kind === 'saved'
                      ? 'Saved'
                      : e.kind === 'received'
                        ? 'Received'
                        : (goals.find((g) => g.id === e.goal_id)?.name ??
                          'Contribution')}{' '}
                    · {e.date}
                  </p>
                  {interest.byEntry[e.id] != null && (
                    <p className="text-xs text-primary">
                      Estimated interest saved:{' '}
                      {money(interest.byEntry[e.id])}
                    </p>
                  )}
                </div>
                <span className="text-sm font-amount whitespace-nowrap">
                  {e.kind === 'contribution' ? '−' : '+'}
                  {money(e.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
      <Dialog
        open={panel !== null}
        onOpenChange={(v) => {
          if (!v && !command.isPending && !saving) {
            setPanel(null);
            setEditing(undefined);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto w-[calc(100%-2rem)] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              {panel === 'history'
                ? 'Savings, received money and contributions. Unlinking keeps the original transaction.'
                : panel === 'goal'
                  ? 'Choose a Debt or Savings category. Past contributions stay with their original goal; only unused funds carry over.'
                  : 'Track money towards your goal without counting transactions twice.'}
            </DialogDescription>
          </DialogHeader>
          {(panel === 'add' || panel === 'contribute') && (
            <BoostEntryForm
              key={editing?.id ?? panel}
              goal={goal}
              entries={entries}
              editing={editing}
              contribution={panel === 'contribute'}
              available={totals.available}
              currency={currency}
              onSaving={setSaving}
              onDone={() => {
                setPanel(null);
                setEditing(undefined);
              }}
            />
          )}
          {panel === 'goal' && (
            <BoostGoalForm
              goal={goal}
              entries={entries}
              currency={currency}
              onSaving={setSaving}
              onDone={() => setPanel(null)}
            />
          )}
          {panel === 'history' && (
            <div className="space-y-4">
              <label className="grid gap-1 text-sm">
                Period
                <select
                  className={selectClass}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="all">All time</option>
                  <option value="month">This month</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p>
                  Saved{' '}
                  <strong className="block">{money(filtered.saved)}</strong>
                </p>
                <p>
                  Received{' '}
                  <strong className="block">
                    {money(filtered.received)}
                  </strong>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Available across all months: {money(totals.available)}
              </p>
              {history.length === 0 && <p>No entries for this period.</p>}
              {history.map((e) => (
                <div key={e.id} className="border-t pt-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {e.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.date} ·{' '}
                        {e.kind === 'contribution'
                          ? goals.find((g) => g.id === e.goal_id)?.name
                          : e.kind === 'saved'
                            ? 'Saved'
                            : 'Received'}
                      </p>
                      {interest.byEntry[e.id] != null && (
                        <p className="text-xs text-primary">
                          Estimated interest saved:{' '}
                          {money(interest.byEntry[e.id])}
                        </p>
                      )}
                      {e.kind === 'contribution' &&
                        goals.find((g) => g.id === e.goal_id)?.kind ===
                          'Debt' &&
                        interest.byEntry[e.id] == null && (
                          <p className="text-xs text-muted-foreground">
                            Interest estimate unavailable — check debt
                            details.
                          </p>
                        )}
                      {e.face_value != null && (
                        <p className="text-xs text-muted-foreground">
                          {money(e.face_value)} voucher · paid{' '}
                          {money(e.paid ?? 0)}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap">
                      {e.kind === 'contribution' ? '−' : '+'}
                      {money(e.amount)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {e.kind === 'saved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(e);
                          setPanel('add');
                          setError('');
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRemoving(e);
                        setError('');
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {e.kind === 'saved' ? 'Delete' : 'Unlink'}
                    </Button>
                  </div>
                  {removing?.id === e.id && (
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-sm">
                        {e.kind === 'saved'
                          ? 'Delete this saving?'
                          : 'Remove this Goal Boost link? The original transaction stays.'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={command.isPending}
                          onClick={remove}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={command.isPending}
                          onClick={() => setRemoving(undefined)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
