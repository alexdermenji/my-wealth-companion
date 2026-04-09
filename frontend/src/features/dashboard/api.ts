import { supabase } from "@/shared/auth/supabase";
import type { DashboardSummary, MonthlyComparison } from "./types";

export const dashboardApi = {
  getSummary: async (year: number, month: number): Promise<DashboardSummary> => {
    const { data, error } = await supabase.rpc("get_dashboard_summary", {
      p_year: year,
      p_month: month,
    });
    if (error) throw new Error(error.message);
    return data as DashboardSummary;
  },

  getMonthlyComparison: async (year: number): Promise<MonthlyComparison> => {
    const { data, error } = await supabase.rpc("get_monthly_comparison", { p_year: year });
    if (error) throw new Error(error.message);
    return data as MonthlyComparison;
  },
};
