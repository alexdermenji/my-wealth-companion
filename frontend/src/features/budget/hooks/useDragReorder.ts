import { type DragEvent, useRef, useState } from 'react';
import type { BudgetCategory } from '@/shared/types';
import { useReorderCategory } from '@/shared/hooks/useCategories';

/**
 * Manages drag-and-drop row reordering for a budget section.
 * Applies an optimistic local reorder immediately on drop, then persists
 * to the backend and clears the optimistic state once the server responds.
 */
export function useDragReorder(typeCats: BudgetCategory[]) {
  const reorderMutation = useReorderCategory();
  const dragIndexRef = useRef<number | null>(null);
  const [dropLineIndex, setDropLineIndex] = useState<number | null>(null);
  const [optimisticCats, setOptimisticCats] = useState<BudgetCategory[] | null>(null);

  const displayCats = optimisticCats ?? typeCats;

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    // Show the drop line above this row if cursor is in the top half, below if in the bottom half.
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

    // Destination index after removing the dragged item from its original position.
    let dest = dropLineIndex > dragIndex ? dropLineIndex - 1 : dropLineIndex;
    dest = Math.max(0, Math.min(dest, displayCats.length - 1));

    if (dest === dragIndex) {
      dragIndexRef.current = null;
      setDropLineIndex(null);
      return;
    }

    const reordered = [...displayCats];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dest, 0, moved);
    setOptimisticCats(reordered);

    dragIndexRef.current = null;
    setDropLineIndex(null);

    reorderMutation.mutate(
      { id: moved.id, newOrder: dest },
      { onSuccess: () => setOptimisticCats(null) },
    );
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropLineIndex(null);
  };

  return {
    displayCats,
    dropLineIndex,
    dragIndexRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
