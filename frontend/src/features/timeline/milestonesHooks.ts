import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { netWorthMilestonesApi } from './milestonesApi';
import type { UserMilestone } from './utils';

const QK = ['netWorthMilestones'] as const;

export function useNetWorthMilestones() {
  return useQuery({ queryKey: QK, queryFn: () => netWorthMilestonesApi.getAll() });
}

export function useCreateNetWorthMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<UserMilestone, 'id'>) => netWorthMilestonesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK }),
  });
}

export function useUpdateNetWorthMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<UserMilestone, 'id'> }) =>
      netWorthMilestonesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteNetWorthMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => netWorthMilestonesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK }),
  });
}
