import { api } from "./client";
import type { BudgetCategory } from "@/lib/types";

export const categoriesApi = {
  getAll: (type?: string) => {
    const params = type ? `?type=${type}` : "";
    return api.get<BudgetCategory[]>(`/categories${params}`);
  },
  create: (data: Omit<BudgetCategory, "id">) =>
    api.post<BudgetCategory>("/categories", data),
  update: (id: string, data: Omit<BudgetCategory, "id">) =>
    api.put<BudgetCategory>(`/categories/${id}`, data),
  delete: (id: string) => api.delete<void>(`/categories/${id}`),
};
