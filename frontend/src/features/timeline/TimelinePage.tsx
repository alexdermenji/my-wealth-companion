import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Flag, Link2, Sparkles, WalletCards } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/features/settings/hooks';
import { useCategories } from '@/shared/hooks/useCategories';
import { useNetWorthItems, useNetWorthValues } from '@/features/net-worth/hooks';
import { useBudgetPlans } from '@/features/budget/hooks';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { buildDebtTimelineModel } from './utils';

function formatMoney(value: number, currency: string, digits = 0) {
  return `${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}`;
}

function monthsLabel(months: number) {
  return months === 1 ? '1 month left' : `${months} months left`;
}

function unforecastedLabel(reason: 'unlinked' | 'no-payment' | 'no-snapshot') {
  if (reason === 'unlinked') return 'No payment link yet';
  if (reason === 'no-payment') return 'No budget payment found';
  return 'No balance snapshot this year';
}

export default function TimelinePage() {
  const now = new Date();
  const year = now.getFullYear();
  const isMobile = useIsMobile();

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: items = [], isLoading: itemsLoading } = useNetWorthItems();
  const { data: values = [], isLoading: valuesLoading } = useNetWorthValues(year);
  const { data: budgetPlans = [], isLoading: budgetPlansLoading } = useBudgetPlans(year);
  const { data: debtCategories = [], isLoading: debtCategoriesLoading } = useCategories('Debt');

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

  if (settingsLoading || itemsLoading || valuesLoading || budgetPlansLoading || debtCategoriesLoading) {
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
            Forecasted from your latest liability balances and linked monthly debt payments.
          </p>
        </div>
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
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Closed already</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{model.closed.length}</p>
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
              {model.forecasted.length > 0
                ? 'Soonest payoff first, using your linked budget payment as the recurring monthly amount.'
                : 'No active debts can be projected yet.'}
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-5">
            {model.forecasted.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Nothing on the payoff line yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a current balance in Net Worth and link the liability to a debt category with a planned payment.
                </p>
                <Button asChild className="mt-4 rounded-full">
                  <Link to="/net-worth">Open Net Worth</Link>
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-5">
                  {model.forecasted.map((entry, index) => (
                    <div
                      key={entry.itemId}
                      className="relative md:grid md:grid-cols-[130px_44px_minmax(0,1fr)] md:gap-5"
                    >
                      <div className="mb-3 md:mb-0 md:pr-2">
                        <div
                          className="inline-flex rounded-2xl px-3 py-2 font-display text-sm font-bold"
                          style={{
                            color: '#5b4ce1',
                            background: 'rgba(108,92,231,0.08)',
                            border: '1px solid rgba(108,92,231,0.18)',
                            boxShadow: '0 10px 24px rgba(108,92,231,0.10)',
                          }}
                        >
                          {entry.projectedLabel}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{monthsLabel(entry.monthsToClose)}</p>
                      </div>

                      <div className="relative hidden self-stretch md:flex md:justify-center">
                        {index < model.forecasted.length - 1 && (
                          <div
                            className="absolute bottom-[-1.25rem] left-1/2 top-[3.25rem] w-px -translate-x-1/2"
                            style={{ background: 'linear-gradient(to bottom, rgba(108,92,231,0.16), transparent)' }}
                          />
                        )}
                        <div
                          className="relative mt-5 flex h-7 w-7 items-center justify-center rounded-full bg-background"
                          style={{
                            border: '1px solid rgba(108,92,231,0.18)',
                            boxShadow: '0 10px 24px rgba(108,92,231,0.12)',
                          }}
                        >
                          <div className="absolute inset-0 rounded-full blur-[6px]" style={{ background: 'rgba(108,92,231,0.08)' }} />
                          <div
                            className="absolute left-1/2 top-1/2 h-px w-7"
                            style={{ background: 'linear-gradient(to right, rgba(108,92,231,0.20), transparent)' }}
                          />
                          <div className="relative flex h-full w-full items-center justify-center rounded-full">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
                          <div
                            className="px-5 py-4"
                            style={{ background: 'linear-gradient(135deg, rgba(108,92,231,0.10), transparent 58%)' }}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-display text-2xl font-bold text-foreground">{entry.name}</h3>
                                  {index === 0 && (
                                    <Badge
                                      className="text-white"
                                      style={{ background: 'linear-gradient(135deg, #6c5ce7, #8b78ff)' }}
                                    >
                                      Next up
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {entry.group || 'Debt'} • snapshot from {entry.snapshotLabel}
                                </p>
                              </div>

                              <div
                                className="rounded-2xl px-3 py-2 text-right"
                                style={{
                                  border: '1px solid rgba(245,158,11,0.20)',
                                  background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(255,255,255,0.92))',
                                }}
                              >
                                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-300/80">Projected close</p>
                                <p className="mt-1 font-display text-lg font-bold text-foreground">{entry.projectedLabel}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
                            <div
                              className="rounded-2xl p-4"
                              style={{ background: 'linear-gradient(180deg, rgba(108,92,231,0.08), rgba(248,250,252,0.7))' }}
                            >
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current balance</p>
                              <p className="mt-2 font-display text-xl font-bold text-foreground">
                                {formatMoney(entry.currentBalance, currency)}
                              </p>
                            </div>
                            <div
                              className="rounded-2xl p-4"
                              style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.10), rgba(248,250,252,0.76))' }}
                            >
                              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">Monthly payment</p>
                              <p className="mt-2 font-display text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                {formatMoney(entry.monthlyPayment, currency, 2)}
                              </p>
                            </div>
                            <div
                              className="rounded-2xl p-4"
                              style={{ background: 'linear-gradient(180deg, rgba(56,189,248,0.08), rgba(248,250,252,0.76))' }}
                            >
                              <p className="text-xs uppercase tracking-[0.18em] text-sky-700/80 dark:text-sky-300/80">Time left</p>
                              <p className="mt-2 font-display text-xl font-bold text-sky-700 dark:text-sky-300">{monthsLabel(entry.monthsToClose)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 border-t border-border/60 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                            <span>
                              {entry.linkedCategoryName ? `Budget payment: ${entry.linkedCategoryName}` : 'Using linked debt category'}
                            </span>
                            <Link to="/net-worth" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                              Review in Net Worth
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
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
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{entry.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.group || 'Debt'}</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
                        Closed
                      </Badge>
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
    </div>
  );
}
