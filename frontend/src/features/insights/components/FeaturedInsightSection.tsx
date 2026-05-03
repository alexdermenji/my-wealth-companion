import { computeInsights } from '../computeInsights';
import { useInsightsInput } from '../useInsightsInput';
import { FeaturedInsightCard } from './FeaturedInsightCard';

export function FeaturedInsightSection({ className }: { className?: string }) {
  const { input, isLoading } = useInsightsInput();

  if (isLoading || !input) return null;

  const featured = computeInsights(input).find(i => i.featured);
  if (!featured) return null;

  return <FeaturedInsightCard insight={featured} className={className} />;
}
