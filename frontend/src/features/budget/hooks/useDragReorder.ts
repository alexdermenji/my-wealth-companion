import { type DragEvent, useRef, useState } from 'react';
import type { BudgetCategory } from '@/shared/types';
import { useReorderCategory } from '@/shared/hooks/useCategories';
import { toast } from 'sonner';
import { moveVisibleBudgetCategory, partitionBudgetCategories } from '../visibility';

/**
 * Manages drag-and-drop row reordering for a budget section.
 * Applies an optimistic local reorder immediately on drop, then persists
 * to the backend and clears the optimistic state once the server responds.
 */
export function useDragReorder(typeCats: BudgetCategory[]) {
  const reorderMutation = useReorderCategory();
  const dragIndexRef = useRef<number | null>(null);
  const [dropLineIndex, setDropLineIndex] = useState<number | null>(null);
  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null);

  // Keep only order optimistic, never a stale copy of category visibility/data.
  const fullCats = optimisticIds
    ? [...typeCats].sort((a, b) => {
      const rank = (id: string) => {
        const index = optimisticIds.indexOf(id);
        return index < 0 ? optimisticIds.length : index;
      };
      return rank(a.id) - rank(b.id);
    })
    : typeCats;
  const { visible: displayCats } = partitionBudgetCategories(fullCats);

  const handleDragStart = (index: number) => {
    if (reorderMutation.isPending) return;
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
    if (reorderMutation.isPending) return;
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

    const moved = displayCats[dragIndex];
    if (!moved) return;
    const result = moveVisibleBudgetCategory(fullCats, moved.id, dest);
    if (!result) return;
    setOptimisticIds(result.categories.map(category => category.id));

    dragIndexRef.current = null;
    setDropLineIndex(null);

    reorderMutation.mutate(
      { id: moved.id, newOrder: result.newOrder },
      {
        onError: () => toast.error("Couldn't reorder categories. Please try again."),
        onSettled: () => setOptimisticIds(null),
      },
    );
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropLineIndex(null);
  };

  return {
    displayCats,
    isReordering: reorderMutation.isPending,
    dropLineIndex,
    dragIndexRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
