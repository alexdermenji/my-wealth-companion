import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBudgetVisibility } from '../hooks/useBudgetVisibility';
const save = vi.hoisted(() => vi.fn());
vi.mock('@/shared/hooks/useCategories', () => ({ useSetCategoryHiddenInBudget: () => ({ mutateAsync: save }) }));
describe('budget visibility request lifecycle', () => {
  it('blocks duplicate requests for the same item until saving finishes', async () => {
    let finish!: () => void;
    save.mockReset().mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useBudgetVisibility([]));
    let request!: Promise<void>;
    act(() => {
      request = result.current.setHidden('a', true);
      void result.current.setHidden('a', true);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.pendingIds.has('a')).toBe(true);
    await act(async () => { finish(); await request; });
    expect(result.current.pendingIds.size).toBe(0);
  });
  it('allows retry after a failed save', async () => {
    save.mockReset().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useBudgetVisibility([]));
    await act(async () => { await result.current.setHidden('a', false); });
    expect(result.current.pendingIds.size).toBe(0);
    await act(async () => { await result.current.setHidden('a', false); });
    expect(save).toHaveBeenCalledTimes(2);
  });
});
