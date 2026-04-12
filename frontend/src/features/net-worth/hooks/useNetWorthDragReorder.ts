import { type DragEvent, useRef, useState } from 'react';
import type { NetWorthItem } from '../types';
import { useReorderNetWorthItem } from './useNetWorthItems';

export function useNetWorthDragReorder(typeItems: NetWorthItem[]) {
  const reorderMutation = useReorderNetWorthItem();
  const dragIndexRef = useRef<number | null>(null);
  const [dropLineIndex, setDropLineIndex] = useState<number | null>(null);
  const [optimisticItems, setOptimisticItems] = useState<NetWorthItem[] | null>(null);

  const displayItems = optimisticItems ?? typeItems;

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropLineIndex(e.clientY < midY ? index : index + 1);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dropLineIndex === null) {
      dragIndexRef.current = null;
      setDropLineIndex(null);
      return;
    }

    let dest = dropLineIndex > dragIndex ? dropLineIndex - 1 : dropLineIndex;
    dest = Math.max(0, Math.min(dest, displayItems.length - 1));

    if (dest === dragIndex) {
      dragIndexRef.current = null;
      setDropLineIndex(null);
      return;
    }

    const reordered = [...displayItems];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dest, 0, moved);
    setOptimisticItems(reordered);

    dragIndexRef.current = null;
    setDropLineIndex(null);

    reorderMutation.mutate(
      { id: moved.id, newOrder: dest },
      { onSuccess: () => setOptimisticItems(null) },
    );
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropLineIndex(null);
  };

  return {
    displayItems,
    dropLineIndex,
    dragIndexRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
