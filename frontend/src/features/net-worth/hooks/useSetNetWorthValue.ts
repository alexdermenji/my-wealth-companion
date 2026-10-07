import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { netWorthApi } from '../api';

export function useSetNetWorthValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { itemId: string; year: number; month: number; amount: number }) =>
      netWorthApi.setValue(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthItems'] });
      queryClient.invalidateQueries({ queryKey: ['netWorthValues'] });
    },
    onError: () => {
      toast.error('Failed to save value', { id: 'nw-saved' });
    },
  });
}
