import { useSettings } from '@/features/settings/hooks';
import { useNetWorthItems, useAllNetWorthValues } from '@/features/net-worth/hooks';
import { NetWorthChart } from '@/features/timeline/components/NetWorthChart';
import { useEngagementSummary } from '@/features/engagement/hooks';
import { StreakBanner } from '@/features/engagement/components/StreakBanner';
import { TaskPanel } from '@/features/engagement/components/TaskPanel';
import { WhatYouMissedBanner } from '@/features/engagement/components/WhatYouMissedBanner';

export default function DashboardPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: items = [], isLoading: itemsLoading } = useNetWorthItems();
  const { data: values = [], isLoading: valuesLoading } = useAllNetWorthValues();
  const { data: engagement } = useEngagementSummary();

  const currency = settings?.currency ?? '$';
  const isLoading = settingsLoading || itemsLoading || valuesLoading;

  const daysSince = engagement?.tasks.daysSinceLastTransaction ?? 0;
  const showMissedBanner = daysSince >= 2;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your financial overview</p>
      </div>

      {/* What you missed — shown when returning after 2+ days */}
      {engagement && showMissedBanner && (
        <WhatYouMissedBanner daysSince={daysSince} tasks={engagement.tasks} />
      )}

      {/* Streak banner */}
      {engagement && <StreakBanner streak={engagement.streak} />}

      {/* Main content + task panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

        {/* Task panel — above chart on mobile, right column on desktop */}
        <div className="lg:order-2">
          {engagement ? (
            <TaskPanel tasks={engagement.tasks} />
          ) : (
            <div className="bg-card border border-border rounded-xl h-48 animate-pulse" />
          )}
        </div>

        {/* Charts */}
        <div className="space-y-4 lg:order-1">
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
        </div>
      </div>
    </div>
  );
}
