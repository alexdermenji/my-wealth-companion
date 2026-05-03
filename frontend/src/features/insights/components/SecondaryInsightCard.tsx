import { cn } from '@/lib/utils';
import type { Insight } from '../types';

const TYPE_CONFIG: Record<Insight['type'], { labelColor: string; label: string; actionColor: string }> = {
  warning:  { labelColor: 'text-amber-500', label: '⚠ Warning', actionColor: 'text-amber-600' },
  info:     { labelColor: 'text-savings',   label: '◈ Info',    actionColor: 'text-savings' },
  positive: { labelColor: 'text-income',    label: '✦ Good',    actionColor: 'text-income' },
};

const TIP_CONFIG = { labelColor: 'text-blue-400', label: '💡 Tip', actionColor: 'text-blue-500' };

export function SecondaryInsightCard({ insight }: { insight: Insight }) {
  const config = insight.isTip ? TIP_CONFIG : TYPE_CONFIG[insight.type];

  return (
    <div className={cn(
      'w-full h-full rounded-[18px] border bg-card p-4 shadow-sm',
      insight.isTip ? 'border-blue-100' : 'border-border',
    )}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2.5', config.labelColor)}>
        {config.label}
      </p>
      <p className="text-xs font-semibold text-foreground leading-snug mb-1.5">
        {insight.headline}
      </p>
      <p className={cn(
        'font-amount text-xl font-bold tracking-tight mb-1',
        insight.isTip ? 'text-muted-foreground' : 'text-foreground',
      )}>
        {insight.value}
      </p>
      {insight.subtext && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
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
