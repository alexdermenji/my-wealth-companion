import { useSettings } from '@/features/settings/hooks';
import { useNetWorthItems, useAllNetWorthValues } from '@/features/net-worth/hooks';
import { NetWorthChart } from '@/features/timeline/components/NetWorthChart';

export default function DashboardPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: items = [], isLoading: itemsLoading } = useNetWorthItems();
  const { data: values = [], isLoading: valuesLoading } = useAllNetWorthValues();

  const currency = settings?.currency ?? '$';
  const isLoading = settingsLoading || itemsLoading || valuesLoading;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your financial overview</p>
      </div>

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
  );
}
