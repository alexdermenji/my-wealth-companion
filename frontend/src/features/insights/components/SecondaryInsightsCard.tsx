import { cn } from '@/lib/utils';
import { computeInsights } from '../computeInsights';
import { computeTips } from '../tips';
import { useInsightsInput } from '../useInsightsInput';
import type { Insight } from '../types';

const SECONDARY_TARGET = 2;

const TYPE_CONFIG: Record<Insight['type'], { labelColor: string; label: string; actionColor: string }> = {
  warning:  { labelColor: 'text-amber-500', label: '⚠ Warning', actionColor: 'text-amber-600' },
  info:     { labelColor: 'text-savings',   label: '◈ Info',    actionColor: 'text-savings' },
  positive: { labelColor: 'text-income',    label: '✦ Good',    actionColor: 'text-income' },
};
const TIP_CONFIG = { labelColor: 'text-blue-400', label: '💡 Tip', actionColor: 'text-blue-500' };

function InsightItem({ insight }: { insight: Insight }) {
  const config = insight.isTip ? TIP_CONFIG : TYPE_CONFIG[insight.type];
  return (
    <div className="flex-1 min-w-0 p-4">
      <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', config.labelColor)}>
        {config.label}
      </p>
      <p className="text-xs font-semibold text-foreground leading-snug mb-1">
        {insight.headline}
      </p>
      <p className={cn(
        'font-amount text-xl font-bold tracking-tight mb-1',
        insight.isTip ? 'text-muted-foreground' : 'text-foreground',
      )}>
        {insight.value}
      </p>
      {insight.subtext && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
          {insight.subtext}
        </p>
      )}
      {insight.actionLabel && (
        <p className={cn('text-[11px] font-semibold', config.actionColor)}>
          {insight.actionLabel} →
        </p>
      )}
    </div>
  );
}

export function SecondaryInsightsCard({ className }: { className?: string }) {
  const { input, isLoading } = useInsightsInput();

  if (isLoading || !input) return null;

  const insights = computeInsights(input);
  if (insights.length === 0) return null;

  const secondary = insights.filter(i => !i.featured);
  const presentIds = new Set(secondary.map(i => i.id));
  const needed = Math.max(0, SECONDARY_TARGET - secondary.length);
  const tips = computeTips(input, presentIds).slice(0, needed);
  const items = [...secondary, ...tips];

  if (items.length === 0) return null;

  return (
    <div className={cn('bg-card border border-border rounded-2xl overflow-hidden shadow-sm', className)}>
      <div className="flex divide-x divide-border">
        {items.map(insight => (
          <InsightItem key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}
