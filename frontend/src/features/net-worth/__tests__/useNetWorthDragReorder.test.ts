import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DragEvent } from 'react';
import type { NetWorthItem } from '../types';
import { useNetWorthDragReorder } from '../hooks/useNetWorthDragReorder';

const mutate = vi.hoisted(() => vi.fn());
vi.mock('../hooks/useNetWorthItems', () => ({ useReorderNetWorthItem: () => ({ mutate }) }));
const all: NetWorthItem[] = ['Hidden first', 'Alpha', 'Hidden middle', 'Beta'].map((name, order) => ({
  id: String(order), name, order, type: 'Asset', group: '', isHidden: name.startsWith('Hidden'),
}));
const event = (clientY: number) => ({
  preventDefault: vi.fn(), clientY,
  currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 20 }) },
}) as unknown as DragEvent<HTMLElement>;

describe('net worth reorder with hidden items', () => {
  it.each([{ from: 1, to: 0, y: 0, expected: 1 }, { from: 0, to: 1, y: 20, expected: 3 }])(
    'maps visible positions to full list: $from -> $to', ({ from, to, y, expected }) => {
      const visible = all.filter(item => !item.isHidden);
      const { result } = renderHook(() => useNetWorthDragReorder(visible, all));
      act(() => result.current.handleDragStart(from));
      act(() => result.current.handleDragOver(event(y), to));
      act(() => result.current.handleDrop(event(y)));
      expect(mutate).toHaveBeenLastCalledWith({ id: visible[from].id, newOrder: expected }, expect.any(Object));
      expect(result.current.displayItems.map(item => item.name)).toEqual(['Beta', 'Alpha']);
      // A rejected save settles too, returning to the server's order.
      act(() => mutate.mock.calls.at(-1)![1].onSettled());
      expect(result.current.displayItems).toEqual(visible);
    },
  );
});
