import { useQuery } from '@tanstack/react-query';
import { budgetPlansApi } from '../api';

export function useBudgetPlans(year: number) {
  return useQuery({
    queryKey: ['budgetPlans', year],
    queryFn: () => budgetPlansApi.getByYear(year),
  });
}
