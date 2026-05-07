import type { BudgetCategory, BudgetPlan, Transaction } from '@/shared/types';
import type { EngagementSummary } from '@/features/engagement/types';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';

export interface InsightStat {
  label: string;
  value: string;
  numericValue: number;
  target?: string;
  color: string; // tailwind bg class
  status?: 'good' | 'bad';
}

export interface InsightPoint {
  text: string;
  positive: boolean;
}

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'positive';
  headline: string;
  value: string;
  stats?: InsightStat[];
  points?: InsightPoint[];
  subtext?: string;
  actionLabel?: string;
  featured?: boolean;
  isTip?: boolean;
  statusLabel?: string;
}

export interface InsightsInput {
  transactions: Transaction[];
  previousMonthTransactions?: Transaction[];
  budgetPlans: BudgetPlan[];
  categories: BudgetCategory[];
  engagement: EngagementSummary;
  netWorthItems: NetWorthItem[];
  netWorthValues: NetWorthValue[];
  today: Date;
}
