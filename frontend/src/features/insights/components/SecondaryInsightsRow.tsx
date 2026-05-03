import type { Insight } from '../types';
import { SecondaryInsightCard } from './SecondaryInsightCard';

export function SecondaryInsightsRow({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pr-6 -mr-4 pl-0.5">
      {insights.map(insight => (
        <SecondaryInsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
