import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { netWorthApi } from '../api';
import type { NetWorthItem } from '../types';

export function useNetWorthItems() {
  return useQuery({
    queryKey: ['netWorthItems'],
    queryFn: () => netWorthApi.getItems(),
  });
}

export function useCreateNetWorthItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<NetWorthItem, 'id' | 'order'>) => netWorthApi.createItem(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['netWorthItems'] }),
  });
}

export function useUpdateNetWorthItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<NetWorthItem, 'id' | 'order'> }) =>
      netWorthApi.updateItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['netWorthItems'] }),
  });
}

export function useDeleteNetWorthItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => netWorthApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthItems'] });
      queryClient.invalidateQueries({ queryKey: ['netWorthValues'] });
    },
  });
}

export function useReorderNetWorthItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) =>
      netWorthApi.reorderItem(id, newOrder),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['netWorthItems'] }),
  });
}
