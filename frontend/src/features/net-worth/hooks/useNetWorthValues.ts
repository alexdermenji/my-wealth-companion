import { useQuery } from '@tanstack/react-query';
import { netWorthApi } from '../api';

export function useNetWorthValues(year: number) {
  return useQuery({
    queryKey: ['netWorthValues', year],
    queryFn: () => netWorthApi.getValuesByYear(year),
  });
}

export function useAllNetWorthValues() {
  return useQuery({
    queryKey: ['netWorthValues', 'all'],
    queryFn: () => netWorthApi.getAllValues(),
  });
}
