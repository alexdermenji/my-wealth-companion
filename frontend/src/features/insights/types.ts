import type { BudgetCategory, BudgetPlan, Transaction } from '@/shared/types';
import type { EngagementSummary } from '@/features/engagement/types';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'positive';
  headline: string;
  value: string;
  subtext?: string;
  actionLabel?: string;
  featured?: boolean;
  isTip?: boolean;
}

export interface InsightsInput {
  transactions: Transaction[];
  budgetPlans: BudgetPlan[];
  categories: BudgetCategory[];
  engagement: EngagementSummary;
  netWorthItems: NetWorthItem[];
  netWorthValues: NetWorthValue[];
  today: Date;
}
