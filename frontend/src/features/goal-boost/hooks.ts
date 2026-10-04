import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalBoostApi } from './api';
export function useGoalBoost() {
  return useQuery({ queryKey: ['goal-boost'], queryFn: goalBoostApi.get });
}
export function useBoostCommand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      data,
    }: {
      action: string;
      data: Record<string, unknown>;
    }) => goalBoostApi.command(action, data),
    onSuccess: async () => {
      await Promise.all(
        ['goal-boost', 'transactions', 'dashboard', 'engagement'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
