import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/shared/api/categoriesApi";
import type { BudgetCategory } from "@/shared/types";
import { toast } from "sonner";

export function useSetCategoryHiddenInBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      categoriesApi.setHiddenInBudget(id, hidden),
    onSuccess: async (category) => {
      queryClient.setQueriesData<BudgetCategory[]>({ queryKey: ["categories"] }, previous =>
        previous?.map(item => item.id === category.id ? { ...item, isHiddenInBudget: category.isHiddenInBudget } : item),
      );
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (_error, { hidden }) => {
      toast.error(hidden ? "Couldn't hide category. Please try again." : "Couldn't restore category. Please try again.");
    },
  });
}

export function useCategories(type?: string, enabled = true) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => categoriesApi.getAll(type),
    enabled,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BudgetCategory, "id" | "order">) =>
      categoriesApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<BudgetCategory, "id" | "order">;
    }) => categoriesApi.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useForceDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.forceDelete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useReorderCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) =>
      categoriesApi.reorder(id, newOrder),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
