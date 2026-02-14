import { api } from "@/shared/api/client";
import type { BudgetPlan } from "./types";

export const budgetPlansApi = {
  getByYear: (year: number, categoryId?: string) => {
    const params = new URLSearchParams({ year: year.toString() });
    if (categoryId) params.set("categoryId", categoryId);
    return api.get<BudgetPlan[]>(`/budget-plans?${params}`);
  },
  setAmount: (data: {
    categoryId: string;
    year: number;
    month: number;
    amount: number;
  }) => api.put<BudgetPlan>("/budget-plans", data),
};
