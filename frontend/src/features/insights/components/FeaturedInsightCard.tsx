import { ArrowUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Insight } from '../types';

export function FeaturedInsightCard({ insight, className }: { insight: Insight; className?: string }) {
  const isWarning = insight.type === 'warning';

  return (
    <div className={cn(
      'relative w-full rounded-2xl border p-5 overflow-hidden',
      isWarning ? 'bg-amber-100 border-amber-200' : 'bg-emerald-100 border-emerald-200',
      className,
    )}>
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/30" />
      <div className="pointer-events-none absolute -bottom-5 right-6 w-16 h-16 rounded-full bg-white/20" />

      {/* Status badge */}
      <div className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full bg-white/50 px-2.5 py-1 mb-3',
        'text-[10px] font-bold uppercase tracking-wider',
        isWarning ? 'text-amber-800' : 'text-emerald-800',
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isWarning ? 'bg-amber-500' : 'bg-emerald-500')} />
        {isWarning ? 'On track to overspend' : 'On track this month'}
      </div>

      <p className={cn('relative text-sm font-semibold leading-snug mb-1', isWarning ? 'text-amber-900' : 'text-emerald-900')}>
        {insight.headline}
      </p>
      <p className={cn('relative font-amount text-3xl font-bold tracking-tight mb-1', isWarning ? 'text-amber-900' : 'text-emerald-900')}>
        {insight.value}
      </p>
      {insight.subtext && (
        <p className={cn('relative text-xs leading-relaxed mb-4', isWarning ? 'text-amber-700' : 'text-emerald-700')}>
          {insight.subtext}
        </p>
      )}
      {insight.actionLabel && (
        <div className={cn(
          'relative inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5',
          'text-xs font-semibold',
          isWarning ? 'text-amber-900' : 'text-emerald-900',
        )}>
          {isWarning ? <ArrowUp className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {insight.actionLabel}
        </div>
      )}
    </div>
  );
}
