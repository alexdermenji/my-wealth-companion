import { useEffect, useRef, useState } from 'react';
import type { NetWorthValue } from '../types';

interface UseNetWorthTabFillParams {
  values: NetWorthValue[];
  onAmountChange: (itemId: string, month: number, value: string) => void;
}

export function useNetWorthTabFill({ values, onAmountChange }: UseNetWorthTabFillParams) {
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [tabFills, setTabFills] = useState<Record<string, string>>({});

  // Drop optimistic fills once React Query returns real values for those cells.
  useEffect(() => {
    if (Object.keys(tabFills).length === 0) return;
    setTabFills(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        const [itemId, monthStr] = key.split('|');
        const val = values.find(v => v.itemId === itemId);
        if ((val?.months[parseInt(monthStr, 10)] ?? 0) > 0) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  const getValue = (itemId: string, month: number): number => {
    const fill = tabFills[`${itemId}|${month}`];
    if (fill !== undefined) return parseFloat(fill) || 0;
    const val = values.find(v => v.itemId === itemId);
    return val?.months[month] ?? 0;
  };

  const handleTab = (itemId: string, month: number, value: string) => {
    if (month >= 12) return;
    const nextMonth = month + 1;
    if (value && getValue(itemId, nextMonth) === 0) {
      setTabFills(prev => ({ ...prev, [`${itemId}|${nextMonth}`]: value }));
      onAmountChange(itemId, nextMonth, value);
      setTimeout(() => cellRefs.current[`${itemId}|${nextMonth}`]?.focus(), 0);
    } else {
      cellRefs.current[`${itemId}|${nextMonth}`]?.focus();
    }
  };

  return { tabFills, getValue, handleTab, cellRefs };
}
