import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Flag, Link2, MoreVertical, PartyPopper, Pencil, Plus, Sparkles, Trash2, WalletCards } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettings } from '@/features/settings/hooks';
import { useCategories } from '@/shared/hooks/useCategories';
import { useAllNetWorthValues, useNetWorthItems, useNetWorthValues } from '@/features/net-worth/hooks';
import { useBudgetPlans } from '@/features/budget/hooks';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { EventFormDialog } from './components/EventFormDialog';
import { useDeleteTimelineEvent, useTimelineEvents } from './hooks';
import type { TimelineEvent } from './types';
import { buildDebtTimelineModel, buildNetWorthMilestoneModel, buildTimelineFeed } from './utils';

const NET_WORTH_MILESTONES = [100_000, 200_000, 1_000_000];

function formatMoney(value: number, currency: string, digits = 0) {
  return `${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}`;
}

function monthsLabel(months: number) {
  return months === 1 ? '1 month left' : `${months} months left`;
}

function customEventMonthsLabel(eventDate: string) {
  const now = new Date();
  const event = new Date(`${eventDate}T00:00:00`);
  const monthDelta = ((event.getFullYear() - now.getFullYear()) * 12) + (event.getMonth() - now.getMonth());

  if (monthDelta <= 0) return 'This month';
  return monthsLabel(monthDelta);
}

function milestoneStatusLabel(status: 'reached' | 'off-track' | 'projected' | 'unavailable') {
  if (status === 'reached') return 'Reached';
  if (status === 'off-track') return 'Off track';
  if (status === 'projected') return 'Projected';
  return 'Waiting';
}

function unforecastedLabel(reason: 'unlinked' | 'no-payment' | 'no-snapshot') {
  if (reason === 'unlinked') return 'No payment link yet';
  if (reason === 'no-payment') return 'No budget payment found';
  return 'No balance snapshot this year';
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export default function TimelinePage() {
  const now = new Date();
  const year = now.getFullYear();
  const isMobile = useIsMobile();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<TimelineEvent | null>(null);

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: items = [], isLoading: itemsLoading } = useNetWorthItems();
  const { data: values = [], isLoading: valuesLoading } = useNetWorthValues(year);
  const { data: allNetWorthValues = [], isLoading: allNetWorthValuesLoading } = useAllNetWorthValues();
  const { data: budgetPlans = [], isLoading: budgetPlansLoading } = useBudgetPlans(year);
  const { data: debtCategories = [], isLoading: debtCategoriesLoading } = useCategories('Debt');
  const { data: timelineEvents = [], isLoading: timelineEventsLoading } = useTimelineEvents();
  const deleteTimelineEventMutation = useDeleteTimelineEvent();

  const monthLimit = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const currency = settings?.currency ?? '£';

  const model = useMemo(() => buildDebtTimelineModel({
    year,
    monthLimit,
    items,
    values,
    budgetPlans,
    debtCategories,
  }), [budgetPlans, debtCategories, items, monthLimit, values, year]);
  const timelineFeed = useMemo(
    () => buildTimelineFeed(model.forecasted, timelineEvents),
    [model.forecasted, timelineEvents],
  );
  const milestoneModel = useMemo(() => buildNetWorthMilestoneModel({
    items,
    values: allNetWorthValues,
    milestones: NET_WORTH_MILESTONES,
  }), [allNetWorthValues, items]);
  const nextPayoffItemId = model.summary.nextPayoff?.itemId ?? null;

  if (settingsLoading || itemsLoading || valuesLoading || allNetWorthValuesLoading || budgetPlansLoading || debtCategoriesLoading || timelineEventsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-9 w-48 rounded-full bg-muted" />
        <div className="h-48 rounded-[28px] bg-muted" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
          <div className="h-[520px] rounded-[28px] bg-muted" />
          <div className="space-y-6">
            <div className="h-56 rounded-[28px] bg-muted" />
            <div className="h-56 rounded-[28px] bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Timeline
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            Debt payoff timeline
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Debt payoff forecasts and your own dated milestones in one place.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setEventDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add event
        </Button>
      </div>

      <Card className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(108,92,231,0.14),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_60%)]" />
        <CardContent className="relative grid gap-6 p-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Based on balances tracked through {model.summary.nextPayoff?.snapshotLabel ?? `the latest saved month in ${year}`}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Active debt still on the books</p>
              <p className="mt-1 font-display text-4xl font-bold text-foreground">
                {formatMoney(model.summary.totalActiveBalance, currency)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Forecasted</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{model.summary.forecastableCount}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Monthly payoff pace</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">
                  {formatMoney(model.summary.totalMonthlyPayment, currency, 2)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Custom events</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{timelineEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 content-start">
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                <Flag className="h-3.5 w-3.5" />
                Next payoff
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">
                {model.summary.nextPayoff?.projectedLabel ?? 'No forecast yet'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {model.summary.nextPayoff
                  ? `${model.summary.nextPayoff.name} at ${formatMoney(model.summary.nextPayoff.monthlyPayment, currency, 2)}/mo`
                  : 'Link a monthly payment to place a debt on the timeline.'}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
                <WalletCards className="h-3.5 w-3.5" />
                Debt-free target
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">
                {model.summary.debtFreeDate?.projectedLabel ?? 'Pending links'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {model.summary.debtFreeDate
                  ? `Last projected payoff is ${model.summary.debtFreeDate.name}.`
                  : 'The page will estimate a debt-free month once at least one active liability has both a balance and payment.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        <Card className="rounded-[28px] border border-border/70 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="font-display text-xl">Payoff line</CardTitle>
            <p className="text-sm text-muted-foreground">
              {timelineFeed.length > 0
                ? 'Forecasted debt payoffs and custom events, sorted by date.'
                : 'No debt payoffs or custom events yet.'}
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-5">
            {timelineFeed.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Nothing on the timeline yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a custom event or link an active liability to a debt payment to start building your timeline.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Button className="rounded-full" onClick={() => setEventDialogOpen(true)}>Add event</Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/net-worth">Open Net Worth</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-4">
                  {timelineFeed.map((entry, index) => (
                    <div
                      key={entry.kind === 'debt' ? entry.forecast.itemId : entry.id}
                      className="relative md:grid md:grid-cols-[130px_44px_minmax(0,1fr)] md:gap-5"
                    >
                      <div className="mb-3 md:mb-0 md:pr-2">
                        <div className="inline-flex rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 font-display text-sm font-bold text-primary">
                          {entry.dateLabel}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {entry.kind === 'debt' ? monthsLabel(entry.forecast.monthsToClose) : formatDateLabel(entry.eventDate)}
                        </p>
                      </div>

                      <div className="relative hidden self-stretch md:flex md:justify-center">
                        {index < timelineFeed.length - 1 && (
                          <div
                            className="absolute bottom-[-1.25rem] left-1/2 top-[3.25rem] w-px -translate-x-1/2"
                            style={{ background: 'linear-gradient(to bottom, rgba(108,92,231,0.18), rgba(108,92,231,0.03))' }}
                          />
                        )}
                        <div
                          className="relative mt-4 flex h-9 min-w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-sm shadow-[0_8px_18px_rgba(16,185,129,0.12)] dark:border-emerald-900/70 dark:bg-emerald-950/30"
                          style={{
                            color: '#047857',
                          }}
                        >
                          <div
                            className="absolute left-1/2 top-1/2 h-px w-7"
                            style={{ background: 'linear-gradient(to right, rgba(108,92,231,0.18), transparent)' }}
                          />
                          <span className="relative" aria-hidden>{entry.kind === 'debt' ? '🎉' : '✨'}</span>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="overflow-hidden rounded-[22px] border border-border/70 bg-card">
                          <div className="px-4 py-3.5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-display text-xl font-bold leading-tight text-foreground sm:text-[1.65rem]">
                                    {entry.kind === 'debt' ? entry.forecast.name : entry.title}
                                  </h3>
                                  {entry.kind === 'debt' ? (
                                    entry.forecast.itemId === nextPayoffItemId && (
                                      <Badge className="border-0 bg-primary text-primary-foreground">
                                        Next up
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                                      Custom
                                    </Badge>
                                  )}
                                  {entry.kind === 'debt' ? (
                                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300">
                                      <PartyPopper className="mr-1.5 h-3.5 w-3.5" />
                                      Closes {entry.forecast.projectedLabel}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
                                      {formatDateLabel(entry.eventDate)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {entry.kind === 'debt'
                                    ? `${entry.forecast.group || 'Debt'} • snapshot from ${entry.forecast.snapshotLabel}`
                                    : entry.description || 'Manual timeline event'}
                                </p>
                              </div>

                              {entry.kind === 'debt' ? (
                                <Badge variant="outline" className="h-fit border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                                  {monthsLabel(entry.forecast.monthsToClose)}
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="h-fit border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                                    {customEventMonthsLabel(entry.eventDate)}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        aria-label={`Open actions for ${entry.title}`}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => { setEditingEvent(entry.event); setEventDialogOpen(true); }}>
                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setDeletingEvent(entry.event)}
                                        className="text-[hsl(var(--expense))] focus:text-[hsl(var(--expense))]"
                                      >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          </div>

                          {entry.kind === 'debt' ? (
                            <>
                              <div className="flex flex-wrap gap-2 px-4 pb-3">
                                <Badge variant="outline" className="rounded-full border-primary/15 bg-primary/5 px-3 py-1.5 font-normal text-foreground">
                                  <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Balance</span>
                                  <span className="font-display text-sm font-bold">{formatMoney(entry.forecast.currentBalance, currency)}</span>
                                </Badge>
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 font-normal text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
                                  <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">Payment</span>
                                  <span className="font-display text-sm font-bold">{formatMoney(entry.forecast.monthlyPayment, currency, 2)}/mo</span>
                                </Badge>
                                <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 px-3 py-1.5 font-normal text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200">
                                  <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-sky-700/80 dark:text-sky-300/80">Time left</span>
                                  <span className="font-display text-sm font-bold">{monthsLabel(entry.forecast.monthsToClose)}</span>
                                </Badge>
                              </div>

                              <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <span>
                                  {entry.forecast.linkedCategoryName ? `Budget payment: ${entry.forecast.linkedCategoryName}` : 'Using linked debt category'}
                                </span>
                                <Link to="/net-worth" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                                  Review in Net Worth
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                              <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1.5 font-normal text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                                <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-300/80">Event date</span>
                                <span className="font-display text-sm font-bold text-foreground">{formatDateLabel(entry.eventDate)}</span>
                              </Badge>
                              {entry.amount !== null && (
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 font-normal text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
                                  <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">Amount</span>
                                  <span className="font-display text-sm font-bold">{formatMoney(entry.amount, currency, 2)}</span>
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Net worth milestones</CardTitle>
              <p className="text-sm text-muted-foreground">
                First-pass milestone dates from your saved net worth history.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestoneModel.latestPoint ? (
                <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest net worth</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">
                    {formatMoney(milestoneModel.latestPoint.netWorth, currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved in {milestoneModel.latestPoint.label}
                    {milestoneModel.monthlyGrowth !== null && milestoneModel.monthlyGrowth > 0 && ` • trend pace ${formatMoney(milestoneModel.monthlyGrowth, currency)}/month`}
                    {milestoneModel.monthlyGrowth !== null && milestoneModel.monthlyGrowth <= 0 && ' • recent trend is not positive'}
                  </p>
                </div>
              ) : (
                <p className="rounded-2xl bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Add some monthly net worth values to start tracking milestones.
                </p>
              )}

              {milestoneModel.latestPoint && (
                <div className="space-y-3">
                  {milestoneModel.milestones.map(milestone => (
                    <div key={milestone.amount} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-bold text-foreground">{milestone.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {milestone.monthLabel
                              ? milestone.status === 'reached'
                                ? `First hit in ${milestone.monthLabel}`
                                : milestone.status === 'off-track'
                                  ? `First hit in ${milestone.monthLabel}, currently below target`
                                : `Projected for ${milestone.monthLabel}`
                              : 'No projection yet'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            milestone.status === 'reached'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300'
                              : milestone.status === 'off-track'
                                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200'
                              : milestone.status === 'projected'
                                ? 'border-primary/20 bg-primary/5 text-primary'
                                : 'border-border bg-muted/20 text-muted-foreground'
                          }
                        >
                          {milestoneStatusLabel(milestone.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {milestone.status === 'projected' && milestone.monthsAway !== null && (
                          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                            {monthsLabel(milestone.monthsAway)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200">
                          Current {formatMoney(milestone.currentNetWorth, currency)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Closed or cleared</CardTitle>
              <p className="text-sm text-muted-foreground">
                Liabilities with a latest tracked balance of zero stay off the payoff line.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {model.closed.length === 0 ? (
                <p className="rounded-2xl bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No cleared liabilities found for {year}.
                </p>
              ) : (
                model.closed.map(entry => (
                  <div key={entry.itemId} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-lg shadow-[0_8px_18px_rgba(16,185,129,0.12)] dark:border-emerald-900/70 dark:bg-emerald-950/30">
                          <span aria-hidden>🎉</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.group || 'Debt'}</p>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Latest zero balance tracked in {entry.snapshotLabel}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Not forecasted</CardTitle>
              <p className="text-sm text-muted-foreground">
                Optional links are fine. These debts just stay out of the projection until you add what is needed.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {model.unforecasted.length === 0 ? (
                <p className="rounded-2xl bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Every active debt with a balance is already forecasted.
                </p>
              ) : (
                <>
                  {model.unforecasted.map(entry => (
                    <div key={entry.itemId} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{unforecastedLabel(entry.reason)}</p>
                        </div>
                        {entry.currentBalance > 0 && (
                          <span className="font-display text-sm font-bold text-foreground">
                            {formatMoney(entry.currentBalance, currency)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {entry.snapshotLabel ? `Latest balance tracked in ${entry.snapshotLabel}` : 'No balance entered for this year yet'}
                      </p>
                    </div>
                  ))}

                  <Button asChild variant="outline" className="mt-2 w-full rounded-full">
                    <Link to="/net-worth">
                      <Link2 className="mr-2 h-4 w-4" />
                      Manage links in Net Worth
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isMobile && <div className="h-2" aria-hidden />}

      <AlertDialog open={!!deletingEvent} onOpenChange={open => { if (!open) setDeletingEvent(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingEvent?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the custom event from your timeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deletingEvent) return;
                deleteTimelineEventMutation.mutate(deletingEvent.id, { onSuccess: () => setDeletingEvent(null) });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventFormDialog
        open={eventDialogOpen}
        onOpenChange={open => {
          setEventDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
        editingEvent={editingEvent}
      />
    </div>
  );
}
