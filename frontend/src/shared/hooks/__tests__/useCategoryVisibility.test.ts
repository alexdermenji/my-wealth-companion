import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSetCategoryHiddenInBudget } from '../useCategories';
import { categoriesApi } from '@/shared/api/categoriesApi';
import { createHookWrapper, createTestQueryClient } from '@/test/test-utils';
import type { BudgetCategory } from '@/shared/types';
vi.mock('@/shared/api/categoriesApi');
const category: BudgetCategory = { id: 'a', name: 'Rent', group: 'Bills', type: 'Expenses', order: 1 };
describe('saving budget visibility', () => {
  it('updates all category caches only after success, preserving other properties', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['categories', undefined], [category]);
    client.setQueryData(['categories', 'Expenses'], [category]);
    vi.mocked(categoriesApi.setHiddenInBudget).mockResolvedValue({ ...category, isHiddenInBudget: true });
    const { result } = renderHook(() => useSetCategoryHiddenInBudget(), { wrapper: createHookWrapper(client) });
    await act(async () => { await result.current.mutateAsync({ id: 'a', hidden: true }); });
    for (const key of [['categories', undefined], ['categories', 'Expenses']]) {
      expect(client.getQueryData(key)).toEqual([{ ...category, isHiddenInBudget: true }]);
    }
  });
  it('leaves saved visibility unchanged when the request fails', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['categories'], [category]);
    vi.mocked(categoriesApi.setHiddenInBudget).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSetCategoryHiddenInBudget(), { wrapper: createHookWrapper(client) });
    await act(async () => { await expect(result.current.mutateAsync({ id: 'a', hidden: true })).rejects.toThrow('offline'); });
    expect(client.getQueryData(['categories'])).toEqual([category]);
  });
});
