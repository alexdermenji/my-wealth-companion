import { api } from "./client";
import type { Account } from "@/lib/types";

export const accountsApi = {
  getAll: () => api.get<Account[]>("/accounts"),
  create: (data: Omit<Account, "id">) => api.post<Account>("/accounts", data),
  update: (id: string, data: Omit<Account, "id">) =>
    api.put<Account>(`/accounts/${id}`, data),
  delete: (id: string) => api.delete<void>(`/accounts/${id}`),
};
