import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/api/accountsApi";
import type { Account } from "@/lib/types";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Account, "id">) => accountsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Account, "id"> }) =>
      accountsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
