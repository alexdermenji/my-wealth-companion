import { supabase } from "@/shared/auth/supabase";
import type { BudgetPlan } from "./types";

export const budgetPlansApi = {
  getByYear: async (year: number, categoryId?: string): Promise<BudgetPlan[]> => {
    let query = supabase
      .from("BudgetPlans")
      .select("CategoryId, Year, Month, Amount")
      .eq("Year", year);
    if (categoryId) query = query.eq("CategoryId", categoryId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Group flat rows into { categoryId, year, months: { 1: 500, 2: 600, ... } }
    const map = new Map<string, BudgetPlan>();
    for (const row of data as { CategoryId: string; Year: number; Month: number; Amount: number }[]) {
      if (!map.has(row.CategoryId)) {
        map.set(row.CategoryId, { categoryId: row.CategoryId, year, months: {} });
      }
      map.get(row.CategoryId)!.months[row.Month] = row.Amount;
    }
    return Array.from(map.values());
  },

  setAmount: async (payload: {
    categoryId: string;
    year: number;
    month: number;
    amount: number;
  }): Promise<BudgetPlan> => {
    const { data, error } = await supabase.rpc("set_budget_amount", {
      p_category_id: payload.categoryId,
      p_year: payload.year,
      p_month: payload.month,
      p_amount: payload.amount,
    });
    if (error) throw new Error(error.message);

    // Function returns { categoryId, year, months: { "1": 500, ... } } with string keys
    const result = data as { categoryId: string; year: number; months: Record<string, number> };
    const months: Record<number, number> = {};
    for (const [k, v] of Object.entries(result.months)) {
      months[Number(k)] = v;
    }
    return { categoryId: result.categoryId, year: result.year, months };
  },
};
