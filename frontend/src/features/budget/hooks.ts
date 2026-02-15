import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { budgetPlansApi } from "./api";

export function useBudgetPlans(year: number) {
  return useQuery({
    queryKey: ["budgetPlans", year],
    queryFn: () => budgetPlansApi.getByYear(year),
  });
}

export function useSetBudgetAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      categoryId: string;
      year: number;
      month: number;
      amount: number;
    }) => budgetPlansApi.setAmount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetPlans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Budget updated", { id: "budget-saved" });
    },
    onError: () => {
      toast.error("Failed to update budget", { id: "budget-saved" });
    },
  });
}
