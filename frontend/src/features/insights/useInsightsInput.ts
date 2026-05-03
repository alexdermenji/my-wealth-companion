import { useTransactions } from '@/features/transactions/hooks';
import { useBudgetPlans } from '@/features/budget/hooks';
import { useCategories } from '@/shared/hooks/useCategories';
import { useEngagementSummary } from '@/features/engagement/hooks';
import { useNetWorthItems, useAllNetWorthValues } from '@/features/net-worth/hooks';
import type { InsightsInput } from './types';

export function useInsightsInput(): { input: InsightsInput | null; isLoading: boolean } {
  const today = new Date();
  const year = today.getFullYear();

  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: budgetPlans = [], isLoading: bpLoading } = useBudgetPlans(year);
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: engagement, isLoading: engLoading } = useEngagementSummary();
  const { data: netWorthItems = [], isLoading: nwiLoading } = useNetWorthItems();
  const { data: netWorthValues = [], isLoading: nwvLoading } = useAllNetWorthValues();

  const isLoading = txLoading || bpLoading || catLoading || engLoading || nwiLoading || nwvLoading;

  if (!engagement) return { input: null, isLoading };

  return {
    input: { transactions, budgetPlans, categories, engagement, netWorthItems, netWorthValues, today },
    isLoading,
  };
}
