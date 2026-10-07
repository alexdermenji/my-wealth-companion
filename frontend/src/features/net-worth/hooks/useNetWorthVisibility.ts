import { useLayoutEffect, useRef, useState } from 'react';
import type { NetWorthItem } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { netWorthApi } from '../api';

export function useNetWorthVisibility(items: NetWorthItem[]) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => netWorthApi.setHidden(id, hidden),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['netWorthItems'] }); },
    onError: () => toast.error('Failed to change item visibility'),
  });
  const pendingRef = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState(new Set<string>());
  const [focusTarget, setFocusTarget] = useState<{ id: string; hidden: boolean } | null>(null);
  const hiddenButtonRef = useRef<HTMLButtonElement>(null);
  const rowButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useLayoutEffect(() => {
    if (!focusTarget) return;
    const item = items.find(item => item.id === focusTarget.id);
    if (!item || Boolean(item.isHidden) !== focusTarget.hidden) return;
    const target = hiddenButtonRef.current ?? rowButtonRefs.current[focusTarget.id];
    target?.focus();
    setFocusTarget(null);
  }, [items, focusTarget]);

  const setHidden = async (id: string, hidden: boolean) => {
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setPendingIds(new Set(pendingRef.current));
    try {
      await mutation.mutateAsync({ id, hidden });
      setFocusTarget({ id, hidden });
    } catch {
      // The shared mutation reports the error; keep the original list and focus.
    } finally {
      pendingRef.current.delete(id);
      setPendingIds(new Set(pendingRef.current));
    }
  };

  return { setHidden, pendingIds, hiddenButtonRef, rowButtonRefs };
}
