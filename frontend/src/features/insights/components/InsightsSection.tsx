import { computeInsights } from '../computeInsights';
import { computeTips } from '../tips';
import { useInsightsInput } from '../useInsightsInput';
import { FeaturedInsightCard } from './FeaturedInsightCard';
import { SecondaryInsightCard } from './SecondaryInsightCard';
import type { Insight } from '../types';

const SECONDARY_TARGET = 2;

function padWithTips(secondary: Insight[], input: Parameters<typeof computeTips>[0]): Insight[] {
  const presentIds = new Set(secondary.map(i => i.id));
  const needed = Math.max(0, SECONDARY_TARGET - secondary.length);
  return [...secondary, ...computeTips(input, presentIds).slice(0, needed)];
}

export function InsightsSection() {
  const { input, isLoading } = useInsightsInput();

  if (isLoading || !input) return null;

  const insights = computeInsights(input);
  if (insights.length === 0) return null;

  const featured = insights.find(i => i.featured);
  const secondary = padWithTips(insights.filter(i => !i.featured), input);

  if (!featured) return null;

  return (
    <>
      {/* ── Mobile: featured full-width, secondary 2-col grid ── */}
      <div className="md:hidden space-y-3">
        <FeaturedInsightCard insight={featured} />
        {secondary.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {secondary.map(i => <SecondaryInsightCard key={i.id} insight={i} />)}
          </div>
        )}
      </div>

      {/* ── Desktop: all cards in a single flex row ── */}
      <div className="hidden md:flex gap-3 items-stretch">
        <div className="flex-[2] min-w-0">
          <FeaturedInsightCard insight={featured} />
        </div>
        {secondary.map(i => (
          <div key={i.id} className="flex-1 min-w-0">
            <SecondaryInsightCard insight={i} />
          </div>
        ))}
      </div>
    </>
  );
}
