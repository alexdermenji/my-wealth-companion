import { api } from "@/shared/api/client";
import type { Transaction } from "./types";

export const transactionsApi = {
  getAll: (filters?: { budgetType?: string; accountId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.budgetType && filters.budgetType !== "all")
      params.set("budgetType", filters.budgetType);
    if (filters?.accountId && filters.accountId !== "all")
      params.set("accountId", filters.accountId);
    const query = params.toString();
    return api.get<Transaction[]>(`/transactions${query ? `?${query}` : ""}`);
  },
  create: (data: Omit<Transaction, "id">) =>
    api.post<Transaction>("/transactions", data),
  update: (id: string, data: Omit<Transaction, "id">) =>
    api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete<void>(`/transactions/${id}`),
};
