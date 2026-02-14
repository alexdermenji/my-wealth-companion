import { api } from "./client";

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  group: string;
  tracked: number;
  budget: number;
  percentage: number;
}

export interface BudgetTypeBreakdown {
  type: string;
  totalTracked: number;
  totalBudget: number;
  items: CategoryBreakdownItem[];
}

export interface DashboardSummary {
  year: number;
  month: number;
  breakdown: BudgetTypeBreakdown[];
}

export interface MonthData {
  month: number;
  monthName: string;
  income: number;
  expenses: number;
}

export interface MonthlyComparison {
  year: number;
  months: MonthData[];
}

export const dashboardApi = {
  getSummary: (year: number, month: number) =>
    api.get<DashboardSummary>(`/dashboard/summary?year=${year}&month=${month}`),
  getMonthlyComparison: (year: number) =>
    api.get<MonthlyComparison>(`/dashboard/monthly-comparison?year=${year}`),
};
