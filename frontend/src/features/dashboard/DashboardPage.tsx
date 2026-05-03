import { useState } from 'react';
import { useSettings } from '@/features/settings/hooks';
import { useNetWorthItems, useAllNetWorthValues } from '@/features/net-worth/hooks';
import { NetWorthChart } from '@/features/timeline/components/NetWorthChart';
import { useEngagementSummary } from '@/features/engagement/hooks';
import { StreakBanner } from '@/features/engagement/components/StreakBanner';
import { WelcomeBanner } from '@/features/engagement/components/WelcomeBanner';
import { TaskPanel } from '@/features/engagement/components/TaskPanel';
import { OnboardingPanel } from '@/features/engagement/components/OnboardingPanel';
import { WhatYouMissedBanner } from '@/features/engagement/components/WhatYouMissedBanner';
import { TransactionForm, type FormValues } from '@/features/transactions/components/TransactionForm';
import { useAccounts } from '@/shared/hooks/useAccounts';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateTransaction, useCreateTransfer } from '@/features/transactions/hooks';
import { BudgetType } from '@/shared/types';
import { FeaturedInsightSection } from '@/features/insights/components/FeaturedInsightSection';
import { SecondaryInsightsCard } from '@/features/insights/components/SecondaryInsightsCard';

const OUTFLOW_TYPES = ['Expenses', 'Debt'];

export default function DashboardPage() {
  const [txOpen, setTxOpen] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: items = [], isLoading: itemsLoading } = useNetWorthItems();
  const { data: values = [], isLoading: valuesLoading } = useAllNetWorthValues();
  const { data: engagement } = useEngagementSummary();
  const { data: accounts = [] }   = useAccounts();
  const { data: categories = [] } = useCategories();

  const createTransaction = useCreateTransaction();
  const createTransfer    = useCreateTransfer();

  const currency = settings?.currency ?? '$';
  const isLoading = settingsLoading || itemsLoading || valuesLoading;

  const isNewUser = engagement !== undefined && engagement.tasks.daysSinceLastTransaction === null;
  const daysSince = engagement?.tasks.daysSinceLastTransaction ?? 0;
  const showMissedBanner = !isNewUser && daysSince >= 2;

  function handleTransactionSubmit(data: FormValues) {
    if (data.budgetType === 'Transfer') {
      createTransfer.mutate({
        date:          data.date,
        amount:        data.amount,
        details:       data.details,
        accountFromId: data.accountId,
        accountToId:   data.accountToId!,
      });
    } else {
      const signedAmount = OUTFLOW_TYPES.includes(data.budgetType)
        ? -Math.abs(data.amount)
        :  Math.abs(data.amount);
      createTransaction.mutate({
        ...data,
        amount:           signedAmount,
        budgetType:       data.budgetType as BudgetType,
        budgetPositionId: data.budgetPositionId ?? '',
      });
    }
    setTxOpen(false);
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-4">
      {/* What you missed — shown when returning after 2+ days */}
      {engagement && showMissedBanner && (
        <WhatYouMissedBanner daysSince={daysSince} tasks={engagement.tasks} />
      )}

      {/* Hero banner — welcome for new users, streak for returning users */}
      {engagement && (
        isNewUser
          ? <WelcomeBanner onAddTransaction={() => setTxOpen(true)} />
          : <StreakBanner streak={engagement.streak} onSpentSelected={() => setTxOpen(true)} />
      )}

      {/* Featured insight + secondary insights (connected) + Task panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
        <div className="lg:order-1 flex flex-col">
          {engagement && !isNewUser && (
            <>
              <FeaturedInsightSection className="rounded-b-none border-b-0" />
              <SecondaryInsightsCard className="rounded-t-none" />
              <div className="flex-1" />
            </>
          )}
        </div>
        <div className="lg:order-2 h-full">
          {engagement ? (
            isNewUser
              ? <OnboardingPanel tasks={engagement.tasks} onAddTransaction={() => setTxOpen(true)} />
              : <TaskPanel tasks={engagement.tasks} onAddTransaction={() => setTxOpen(true)} />
          ) : (
            <div className="bg-card border border-border rounded-xl h-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
      ) : items.length === 0 || values.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-muted/10 px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No net worth data yet. Add assets and liabilities in Net Worth to see your chart.
          </p>
        </div>
      ) : (
        <NetWorthChart items={items} values={values} currency={currency} />
      )}

      {/* Transaction modal — opened when user selects "Yes, I spent" in check-in */}
      <TransactionForm
        open={txOpen}
        onOpenChange={setTxOpen}
        editing={false}
        onSubmit={handleTransactionSubmit}
        accounts={accounts}
        categories={categories}
        hideTrigger
      />
    </div>
  );
}
