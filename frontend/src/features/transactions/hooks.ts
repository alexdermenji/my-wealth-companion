import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionsApi } from "./api";
import type { PaginatedTransactionQuery } from "./api";
import type { Transaction } from "./types";

export function useTransactions(filters?: {
  budgetType?: string;
  accountId?: string;
  month?: number;
  year?: number;
}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => transactionsApi.getAll(filters),
  });
}

export function usePaginatedTransactions(query: PaginatedTransactionQuery) {
  return useQuery({
    queryKey: ["transactions", "paginated", query],
    queryFn: () => transactionsApi.getPage(query),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Transaction, "id">) =>
      transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transaction added", { id: "transaction-added" });
    },
    onError: () => {
      toast.error("Failed to add transaction", { id: "transaction-added" });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<Transaction, "id">;
    }) => transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; amount: number; details: string; accountFromId: string; accountToId: string }) =>
      transactionsApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transaction added", { id: "transaction-added" });
    },
    onError: () => {
      toast.error("Failed to add transaction", { id: "transaction-added" });
    },
  });
}
