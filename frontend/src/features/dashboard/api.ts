import { api } from "@/shared/api/client";
import type { DashboardSummary, MonthlyComparison } from "./types";

export const dashboardApi = {
  getSummary: (year: number, month: number) =>
    api.get<DashboardSummary>(`/dashboard/summary?year=${year}&month=${month}`),
  getMonthlyComparison: (year: number) =>
    api.get<MonthlyComparison>(`/dashboard/monthly-comparison?year=${year}`),
};
