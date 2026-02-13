import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboardApi";

export function useDashboardSummary(year: number, month: number) {
  return useQuery({
    queryKey: ["dashboard", "summary", year, month],
    queryFn: () => dashboardApi.getSummary(year, month),
  });
}

export function useMonthlyComparison(year: number) {
  return useQuery({
    queryKey: ["dashboard", "monthly-comparison", year],
    queryFn: () => dashboardApi.getMonthlyComparison(year),
  });
}
