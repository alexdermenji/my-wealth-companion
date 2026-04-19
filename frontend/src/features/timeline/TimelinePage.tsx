import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { useAllNetWorthValues, useNetWorthItems, useNetWorthValues, useSetNetWorthValue } from '@/features/net-worth/hooks';
import { useBudgetPlans } from '@/features/budget/hooks';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { EventFormDialog } from './components/EventFormDialog';
import { useDeleteTimelineEvent, useTimelineEvents } from './hooks';
import type { TimelineEvent } from './types';
import { buildDebtTimelineModel, buildNetWorthMilestoneModel, buildTimelineFeed, splitDateLabel } from './utils';
import type { DebtTimelineClosed, TimelineFeedEntry } from './utils';

type AugmentedFeedEntry = TimelineFeedEntry | { kind: 'closed-debt'; closed: DebtTimelineClosed; date: Date; dateLabel: string };

const NET_WORTH_MILESTONES = [100_000, 200_000, 1_000_000];

function formatMoney(value: number, currency: string, digits = 0) {
  return `${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}`;
}

function monthsLabel(months: number) {
  return months === 1 ? '1 month' : `${months} months`;
}

function customEventMonthsLabel(eventDate: string) {
  const now = new Date();
  const event = new Date(`${eventDate}T00:00:00`);
  const monthDelta = ((event.getFullYear() - now.getFullYear()) * 12) + (event.getMonth() - now.getMonth());

  if (monthDelta <= 0) return 'This month';
  return monthDelta === 1 ? '1 month' : `${monthDelta} months`;
}

function milestoneStatusLabel(status: 'reached' | 'off-track' | 'projected' | 'unavailable') {
  if (status === 'reached') return 'Reached';
  if (status === 'off-track') return 'Off track';
  if (status === 'projected') return 'Projected';
  return 'Waiting';
}



export default function TimelinePage() {
  const now = new Date();
  const year = now.getFullYear();
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState<'payoff' | 'milestones'>('payoff');
  const [showClosed, setShowClosed] = useState(false);
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
  const setNetWorthValueMutation = useSetNetWorthValue();

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

  const debtProgress = useMemo(() => {
    const liabilityIds = new Set(items.filter(i => i.type === 'Liability').map(i => i.id));
    const monthMap = new Map<string, number>();
    for (const v of allNetWorthValues) {
      if (!liabilityIds.has(v.itemId)) continue;
      for (const [monthStr, amount] of Object.entries(v.months)) {
        const key = `${v.year}-${monthStr.padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) ?? 0) + (amount as number));
      }
    }
    const peak = monthMap.size > 0 ? Math.max(...monthMap.values()) : model.summary.totalActiveBalance;
    const current = model.summary.totalActiveBalance;
    const pct = peak > 0 ? Math.round(((peak - current) / peak) * 100) : 0;
    return { peak, pct };
  }, [allNetWorthValues, items, model.summary.totalActiveBalance]);

  const augmentedFeed = useMemo((): AugmentedFeedEntry[] => {
    if (!showClosed || model.closed.length === 0) return timelineFeed;
    const closedEntries = model.closed.map(c => ({
      kind: 'closed-debt' as const,
      closed: c,
      date: new Date(year, c.snapshotMonth - 1, 1),
      dateLabel: c.snapshotLabel,
    }));
    return [...timelineFeed, ...closedEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [timelineFeed, model.closed, showClosed, year]);

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

  const payoffCard = (
    <Card className="rounded-[28px] border border-border/70 shadow-sm">
      <CardContent className="p-4 pt-4 md:p-6 md:pt-6">
        {/* Card toolbar */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setEventDialogOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add event
          </Button>
          {model.closed.length > 0 && (
            <button
              role="switch"
              aria-checked={showClosed}
              onClick={() => setShowClosed(v => !v)}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="text-xs">Show {model.closed.length} paid off</span>
              <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${showClosed ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${showClosed ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
          )}
        </div>

        {augmentedFeed.length === 0 ? (
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
          <div className="space-y-4 md:space-y-5">
            {augmentedFeed.map((entry, index) => {
              const { month, year: dateYear } = splitDateLabel(entry.dateLabel);
              const isClosed = entry.kind === 'closed-debt';

              if (isClosed) {
                return (
                  <div
                    key={entry.closed.itemId}
                    className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 md:grid-cols-[96px_32px_minmax(0,1fr)] md:gap-x-5 opacity-55"
                  >
                    {/* Date box — closed: slate */}
                    <div className="hidden md:block">
                      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 px-3 py-3 text-center shadow-sm">
                        <p className="md:hidden text-sm font-bold text-slate-500">{month} {dateYear}</p>
                        <p className="hidden md:block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{month}</p>
                        <p className="hidden md:block mt-0.5 font-sans text-xl font-semibold leading-none text-slate-600">{dateYear}</p>
                      </div>
                      <div className="hidden md:flex mt-2 justify-center">
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          Paid off
                        </span>
                      </div>
                    </div>

                    {/* Connector — slate */}
                    <div className="relative flex self-stretch justify-center">
                      {index < augmentedFeed.length - 1 && (
                        <div
                          className="absolute bottom-[-1.5rem] left-1/2 top-[3.5rem] w-px -translate-x-1/2"
                          style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0, rgba(0,0,0,0.08) 5px, transparent 5px, transparent 11px)' }}
                        />
                      )}
                      <div className="relative mt-3 flex h-6 w-6 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-slate-300" />
                      </div>
                    </div>

                    {/* Closed card */}
                    <div className="overflow-hidden rounded-[20px] border border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
                        <div className="min-w-0">
                          <p className="md:hidden mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                            {month} · {dateYear}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-sans text-lg font-semibold leading-snug text-muted-foreground line-through decoration-slate-300">
                              {entry.closed.name}
                            </h3>
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500 text-[11px]">
                              {entry.closed.group || 'Debt'}
                            </Badge>
                          </div>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Paid off
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={entry.kind === 'debt' ? entry.forecast.itemId : entry.id}
                  className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 md:grid-cols-[96px_32px_minmax(0,1fr)] md:gap-x-5"
                >
                  {/* Date box */}
                  <div className="hidden md:block">
                    <div className={`rounded-2xl border px-3 py-3 text-center shadow-sm ${
                      entry.kind === 'debt'
                        ? 'border-emerald-200/70 bg-emerald-50/60'
                        : 'border-amber-200/70 bg-amber-50/60'
                    }`}>
                      <p className={`md:hidden text-sm font-bold ${
                        entry.kind === 'debt' ? 'text-emerald-700' : 'text-amber-600'
                      }`}>
                        {month} {dateYear}
                      </p>
                      <p className={`hidden md:block text-[11px] font-bold uppercase tracking-[0.18em] ${
                        entry.kind === 'debt' ? 'text-emerald-600' : 'text-amber-500'
                      }`}>
                        {month}
                      </p>
                      <p className="hidden md:block mt-0.5 font-sans text-xl font-semibold leading-none text-foreground">
                        {dateYear}
                      </p>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="relative flex self-stretch justify-center">
                    {index < augmentedFeed.length - 1 && (
                      <div
                        className="absolute bottom-[-1.5rem] left-1/2 top-[3.5rem] w-px -translate-x-1/2"
                        style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.12) 0, rgba(0,0,0,0.12) 5px, transparent 5px, transparent 11px)' }}
                      />
                    )}
                    <div className={`relative mt-3 flex h-6 w-6 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-full border shadow-sm ${
                      entry.kind === 'debt'
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}>
                      <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${
                        entry.kind === 'debt' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} />
                    </div>
                  </div>

                  {/* Entry card */}
                  <div className="overflow-hidden rounded-[20px] border border-border/70 bg-gradient-to-b from-violet-50/40 via-white to-white transition-shadow hover:shadow-[0_0_0_1px_rgba(108,92,231,0.12),0_6px_20px_rgba(108,92,231,0.06)]">
                    <div className="flex items-start justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
                      <div className="min-w-0">
                        <p className={`md:hidden mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                          entry.kind === 'debt' ? 'text-emerald-600' : 'text-amber-500'
                        }`}>
                          {month} · {dateYear}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-sans text-lg font-semibold leading-snug text-foreground">
                            {entry.kind === 'debt' ? `${entry.forecast.name} paid off` : entry.title}
                          </h3>
                          {entry.kind === 'debt' ? (
                            <>
                              {entry.forecast.itemId === nextPayoffItemId && (
                                <Badge className="border-0 bg-primary text-primary-foreground text-[11px]">
                                  Next up
                                </Badge>
                              )}
                              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 text-[11px]">
                                {entry.forecast.group || 'Debt'}
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-[11px]">
                              Custom
                            </Badge>
                          )}
                        </div>
                        {entry.kind === 'custom' && entry.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{entry.description}</p>
                        )}
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        {entry.kind === 'debt' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label={`Open actions for ${entry.forecast.name}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to="/net-worth" className="flex items-center">
                                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                                  Review in Net Worth
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setNetWorthValueMutation.mutate({
                                  itemId: entry.forecast.itemId,
                                  year,
                                  month: monthLimit,
                                  amount: 0,
                                })}
                              >
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                Mark as paid off
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {entry.kind === 'custom' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label={`Open actions for ${entry.title}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
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
                        )}
                      </div>
                    </div>

                    {entry.kind === 'debt' && (
                      <>
                        {/* Mobile: compact labeled strip */}
                        <div className="flex divide-x divide-border/60 border-t border-border/60 md:hidden">
                          <div className="flex-1 pl-3 pr-2 py-1.5">
                            <p className="text-[9px] font-medium uppercase text-muted-foreground">Balance</p>
                            <p className="mt-0.5 font-sans text-sm font-bold text-[hsl(var(--expense))]">
                              {formatMoney(entry.forecast.currentBalance, currency)}
                            </p>
                          </div>
                          <div className="flex-1 pl-3 pr-2 py-1.5">
                            <p className="text-[9px] font-medium uppercase text-muted-foreground">Pay</p>
                            <p className="mt-0.5 font-sans text-sm font-bold text-[hsl(var(--income))]">
                              {formatMoney(entry.forecast.monthlyPayment, currency, 2)}/mo
                            </p>
                          </div>
                          <div className="flex-1 pl-3 pr-2 py-1.5">
                            <p className="text-[9px] font-medium uppercase text-muted-foreground">Left</p>
                            <p className="mt-0.5 font-sans text-sm font-bold text-primary">
                              {monthsLabel(entry.forecast.monthsToClose)}
                            </p>
                          </div>
                        </div>
                        {/* Desktop: labeled 3-column grid */}
                        <div className="hidden md:grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
                          <div className="px-5 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Balance</p>
                            <p className="mt-1 font-sans text-sm font-bold text-[hsl(var(--expense))]">
                              {formatMoney(entry.forecast.currentBalance, currency)}
                            </p>
                          </div>
                          <div className="px-5 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Payment</p>
                            <p className="mt-1 font-sans text-sm font-bold text-[hsl(var(--income))]">
                              {formatMoney(entry.forecast.monthlyPayment, currency, 2)}/mo
                            </p>
                          </div>
                          <div className="px-5 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Left</p>
                            <p className="mt-1 font-sans text-sm font-bold text-primary">
                              {monthsLabel(entry.forecast.monthsToClose)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {entry.kind === 'custom' && (
                      <div className={`grid divide-x divide-border/60 border-t border-border/60 ${entry.amount !== null ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {entry.amount !== null && (
                          <div className="pl-3 pr-2 py-1.5 md:px-5 md:py-3">
                            <p className="text-[9px] md:text-[10px] font-medium md:font-normal uppercase md:tracking-[0.18em] text-muted-foreground">Amount</p>
                            <p className="mt-0.5 md:mt-1 font-sans text-sm font-bold text-[hsl(var(--income))]">
                              {formatMoney(entry.amount, currency, 2)}
                            </p>
                          </div>
                        )}
                        <div className="pl-3 pr-2 py-1.5 md:px-5 md:py-3">
                          <p className="text-[9px] md:text-[10px] font-medium md:font-normal uppercase md:tracking-[0.18em] text-muted-foreground">Left</p>
                          <p className="mt-0.5 md:mt-1 font-sans text-sm font-bold text-primary">
                            {customEventMonthsLabel(entry.eventDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const milestonesCard = (
    <Card className="rounded-[28px] border border-border/70 shadow-sm">
      <CardContent className="space-y-3 p-6">
        {milestoneModel.latestPoint ? (
          <>
            <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Latest net worth</p>
              <p className="mt-1 font-sans text-xl font-bold text-foreground">
                {formatMoney(milestoneModel.latestPoint.netWorth, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {milestoneModel.latestPoint.label}
                {milestoneModel.monthlyGrowth !== null && milestoneModel.monthlyGrowth > 0
                  && ` · +${formatMoney(milestoneModel.monthlyGrowth, currency)}/mo`}
                {milestoneModel.monthlyGrowth !== null && milestoneModel.monthlyGrowth <= 0
                  && ' · trend not positive'}
              </p>
            </div>
            <div className="space-y-2">
              {milestoneModel.milestones.map(milestone => {
                const statusColor = {
                  reached:     'border-l-[hsl(var(--income))]',
                  projected:   'border-l-primary',
                  'off-track': 'border-l-[hsl(var(--warning))]',
                  unavailable: 'border-l-border',
                }[milestone.status];
                return (
                  <div
                    key={milestone.amount}
                    className={`overflow-hidden rounded-xl border border-border/70 border-l-2 bg-card ${statusColor}`}
                  >
                    <div className="flex items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-display text-base font-bold text-foreground">{milestone.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {milestone.monthLabel
                            ? milestone.status === 'reached'
                              ? `First hit ${milestone.monthLabel}`
                              : milestone.status === 'off-track'
                                ? `First hit ${milestone.monthLabel}, now below`
                                : `Projected ${milestone.monthLabel}`
                            : 'No projection yet'}
                        </p>
                      </div>
                      <span className={`mt-0.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        milestone.status === 'reached'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : milestone.status === 'off-track'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : milestone.status === 'projected'
                              ? 'bg-primary/5 text-primary border border-primary/20'
                              : 'bg-muted/30 text-muted-foreground border border-border'
                      }`}>
                        {milestoneStatusLabel(milestone.status)}
                      </span>
                    </div>
                    {(milestone.status === 'projected' || milestone.status === 'reached' || milestone.status === 'off-track') && (
                      <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60">
                        {milestone.status === 'projected' && milestone.monthsAway !== null && (
                          <div className="px-4 py-2">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Time away</p>
                            <p className="mt-0.5 font-sans text-sm font-bold text-foreground">{monthsLabel(milestone.monthsAway)}</p>
                          </div>
                        )}
                        <div className={`px-4 py-2 ${milestone.status === 'projected' && milestone.monthsAway !== null ? '' : 'col-span-2'}`}>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current</p>
                          <p className="mt-0.5 font-sans text-sm font-bold text-foreground">
                            {formatMoney(milestone.currentNetWorth, currency)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Add some monthly net worth values to start tracking milestones.
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ── */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Timeline
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Debt payoff forecasts and your own dated milestones in one place.
        </p>
      </div>

      {/* ── Mobile hero card (matches NetWorth mobile pattern) ── */}
      {isMobile && (
        <div
          className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-6 text-white"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78ff 60%, #a99ef8 100%)' }}
        >
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/[0.07]" />
            <div className="absolute -bottom-6 left-4 h-24 w-24 rounded-full bg-white/[0.05]" />
            <div className="absolute -bottom-3 right-4 h-20 w-28 rounded-t-[28px] bg-white/[0.12]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              {/* Left: title + stats */}
              <div className="flex-1 min-w-0">
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-white/70">Debt-free target</p>
                <p className="font-display text-lg font-bold text-white">
                  {model.summary.debtFreeDate?.projectedLabel ?? 'Pending'}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="h-5 w-1 flex-shrink-0 rounded-full bg-[#f9a8d4]" />
                    <span className="w-24 flex-shrink-0 text-white/70">Total debt</span>
                    <span className="font-sans text-white">{formatMoney(model.summary.totalActiveBalance, currency)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="h-5 w-1 flex-shrink-0 rounded-full bg-[#6ee7b7]" />
                    <span className="w-24 flex-shrink-0 text-white/70">Monthly pace</span>
                    <span className="font-sans text-white">{formatMoney(model.summary.totalMonthlyPayment, currency, 2)}</span>
                  </div>
                </div>
              </div>

              {/* Right: progress arc */}
              {(() => {
                const r = 30;
                const cx = 40;
                const cy = 40;
                const sw = 8;
                const C = 2 * Math.PI * r;
                const trackLen = C * 0.75;
                const progressLen = trackLen * Math.min(debtProgress.pct / 100, 1);
                return (
                  <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0 -mt-1">
                    {/* Track */}
                    <circle cx={cx} cy={cy} r={r} fill="none"
                      stroke="rgba(255,255,255,0.15)" strokeWidth={sw}
                      strokeDasharray={`${trackLen} ${C - trackLen}`}
                      strokeLinecap="round"
                      transform={`rotate(135 ${cx} ${cy})`}
                    />
                    {/* Progress */}
                    {progressLen > 0 && (
                      <circle cx={cx} cy={cy} r={r} fill="none"
                        stroke="rgba(255,255,255,0.9)" strokeWidth={sw}
                        strokeDasharray={`${progressLen} ${C}`}
                        strokeLinecap="round"
                        transform={`rotate(135 ${cx} ${cy})`}
                      />
                    )}
                    {/* Label */}
                    <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize="15" fontWeight="700" fontFamily="inherit">
                      {debtProgress.pct}%
                    </text>
                    <text x={cx} y={cy + 11} textAnchor="middle"
                      fill="rgba(255,255,255,0.55)" fontSize="9" fontFamily="inherit">
                      paid off
                    </text>
                  </svg>
                );
              })()}
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-white/15 pt-3">
              <span className="text-sm text-white/70">Next payoff</span>
              <p className="font-display font-extrabold leading-none tracking-tight text-white">
                {model.summary.nextPayoff?.projectedLabel ?? '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile: tab bar + tab content ── */}
      {isMobile && (
        <>
          <div className="flex gap-1.5 rounded-full border border-border bg-card p-1 shadow-sm">
            {([
              { id: 'payoff', label: 'Payoff line', color: 'hsl(var(--primary))' },
              { id: 'milestones', label: 'Milestones', color: '#10b981' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTab === tab.id ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={selectedTab === tab.id ? { background: tab.color } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selectedTab === 'payoff' && payoffCard}
          {selectedTab === 'milestones' && milestonesCard}
        </>
      )}

      {/* ── Desktop: two-column grid ── */}
      {!isMobile && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
          {payoffCard}
          {milestonesCard}
        </div>
      )}

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
