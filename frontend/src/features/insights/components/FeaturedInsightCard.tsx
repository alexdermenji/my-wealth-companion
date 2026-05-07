import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Insight } from '../types';

const RULE_TOOLTIP = '50/30/20 is a budgeting guideline: spend ≤50% of income on Needs (rent, bills, groceries), ≤30% on Wants (dining, entertainment, subscriptions), and save ≥20%. It gives a quick health-check on whether your money is balanced.';

const THEME = {
  warning: {
    card: 'bg-amber-100 border-amber-200',
    text: 'text-amber-900',
    muted: 'text-amber-700',
    badge: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  positive: {
    card: 'bg-emerald-100 border-emerald-200',
    text: 'text-emerald-900',
    muted: 'text-emerald-700',
    badge: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  info: {
    card: 'bg-blue-50 border-blue-200',
    text: 'text-blue-900',
    muted: 'text-blue-700',
    badge: 'text-blue-800',
    dot: 'bg-blue-400',
  },
};

export function FeaturedInsightCard({ insight, className }: { insight: Insight; className?: string }) {
  const theme = THEME[insight.type];

  return (
    <div className={cn('relative w-full rounded-2xl border p-5 overflow-hidden', theme.card, className)}>
      <div className="pointer-events-none absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/30" />
      <div className="pointer-events-none absolute -bottom-5 right-6 w-16 h-16 rounded-full bg-white/20" />

      {/* Context badge */}
      {insight.statusLabel && (
        <div className="relative mb-3 flex items-center gap-2">
          <div className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-white/50 px-2.5 py-1',
            'text-[10px] font-bold uppercase tracking-wider',
            theme.badge,
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', theme.dot)} />
            {insight.statusLabel}
          </div>
          {insight.id === 'wants-needs-split' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className={cn('h-3.5 w-3.5 cursor-help opacity-60', theme.badge)} />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                {RULE_TOOLTIP}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Main content + points side by side */}
      <div className="relative flex gap-3 mb-1">
        {/* Left: headline, body, stats, action */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-base font-bold leading-tight mb-2', theme.text)}>
            {insight.headline}
          </p>

          {insight.subtext && (
            <p className={cn('text-sm leading-relaxed mb-3 whitespace-pre-line', theme.muted)}>
              {insight.subtext}
            </p>
          )}
        </div>

        {/* Right: behavioural points as inset card */}
        {insight.points && insight.points.length > 0 && (
          <div className={cn(
            'flex-shrink-0 flex flex-col gap-3 self-start',
            'pl-3 border-l-2 border-current/20',
          )}>
            {(['positive', 'negative'] as const).map(group => {
              const filtered = insight.points!.filter(p => group === 'positive' ? p.positive : !p.positive);
              if (filtered.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-1.5">
                  {filtered.map((point, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={cn(
                        'flex-shrink-0 text-sm font-bold leading-none',
                        point.positive ? 'text-emerald-600' : 'text-red-500',
                      )}>
                        {point.positive ? '✓' : '✗'}
                      </span>
                      <span className={cn('text-sm leading-snug whitespace-nowrap', theme.muted)}>
                        {point.text}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Numbers — compact footnote */}
      {insight.stats && (
        <div className="relative mb-4">
          <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-60', theme.muted)}>
            Your breakdown this month
          </p>
          <div className="flex gap-4">
            {insight.stats.map(stat => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className={cn('font-amount text-lg font-bold leading-none', theme.text)}>
                    {stat.value}
                  </span>
                  <span className={cn('text-[11px] font-medium', theme.muted)}>
                    {stat.label}
                  </span>
                </div>
                </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
