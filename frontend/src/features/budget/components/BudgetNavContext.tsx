import { createContext, useCallback, useContext, useRef } from 'react';

type ActivateFn = () => void;
type Direction = 'right' | 'left' | 'down' | 'up';

interface BudgetNavContextValue {
  register: (rowKey: string, col: number, activate: ActivateFn) => void;
  unregister: (rowKey: string, col: number) => void;
  registerRows: (sectionType: string, rowKeys: string[]) => void;
  navigate: (fromRowKey: string, fromCol: number, dir: Direction) => void;
}

const BudgetNavContext = createContext<BudgetNavContextValue | null>(null);

export function BudgetNavProvider({ children }: { children: React.ReactNode }) {
  const registry = useRef<Map<string, Map<number, ActivateFn>>>(new Map());
  const sectionRows = useRef<Map<string, string[]>>(new Map());

  const getOrderedRows = () => {
    const order = ['Income', 'Expenses', 'Savings', 'Debt'];
    return order.flatMap(s => sectionRows.current.get(s) ?? []);
  };

  const register = useCallback((rowKey: string, col: number, activate: ActivateFn) => {
    if (!registry.current.has(rowKey)) registry.current.set(rowKey, new Map());
    registry.current.get(rowKey)!.set(col, activate);
  }, []);

  const unregister = useCallback((rowKey: string, col: number) => {
    registry.current.get(rowKey)?.delete(col);
  }, []);

  const registerRows = useCallback((sectionType: string, rowKeys: string[]) => {
    sectionRows.current.set(sectionType, rowKeys);
  }, []);

  const navigate = useCallback((fromRowKey: string, fromCol: number, dir: Direction) => {
    const rows = getOrderedRows();
    const rowIdx = rows.indexOf(fromRowKey);

    let targetRowKey = fromRowKey;
    let targetCol = fromCol;

    if (dir === 'right') {
      if (fromCol < 12) {
        targetCol = fromCol + 1;
      } else {
        if (rowIdx >= rows.length - 1) return;
        targetRowKey = rows[rowIdx + 1];
        targetCol = 1;
      }
    } else if (dir === 'left') {
      if (fromCol > 1) {
        targetCol = fromCol - 1;
      } else {
        if (rowIdx <= 0) return;
        targetRowKey = rows[rowIdx - 1];
        targetCol = 12;
      }
    } else if (dir === 'down') {
      if (rowIdx >= rows.length - 1) return;
      targetRowKey = rows[rowIdx + 1];
    } else if (dir === 'up') {
      if (rowIdx <= 0) return;
      targetRowKey = rows[rowIdx - 1];
    }

    registry.current.get(targetRowKey)?.get(targetCol)?.();
  }, []);

  return (
    <BudgetNavContext.Provider value={{ register, unregister, registerRows, navigate }}>
      {children}
    </BudgetNavContext.Provider>
  );
}

export function useBudgetNav() {
  const ctx = useContext(BudgetNavContext);
  if (!ctx) throw new Error('useBudgetNav must be used within BudgetNavProvider');
  return ctx;
}
