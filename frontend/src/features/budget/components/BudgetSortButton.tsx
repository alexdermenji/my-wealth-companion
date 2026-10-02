import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { MONTHS } from '@/shared/types';
import { cn } from '@/lib/utils';
import type { BudgetSort } from '../sorting';

export function BudgetSortButton({ sort, month, section, onClick, mobile = false }: {
  sort: BudgetSort;
  month: number;
  section: string;
  onClick: () => void;
  mobile?: boolean;
}) {
  const direction = sort?.month === month ? sort.direction : null;
  const next = !direction ? 'Sort highest to lowest' : direction === 'descending' ? 'Sort lowest to highest' : 'Restore manual order';
  const state = direction === 'descending' ? 'Highest to lowest' : direction === 'ascending' ? 'Lowest to highest' : 'Manual order';
  const Icon = direction === 'descending' ? ArrowDown : direction === 'ascending' ? ArrowUp : ArrowUpDown;
  const label = `${section}, ${MONTHS[month - 1]}: ${state}. ${next}`;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:text-primary',
        mobile ? 'min-h-[44px] px-2 text-xs font-medium' : 'min-h-8 w-full uppercase',
        direction && 'text-primary',
      )}
    >
      {mobile ? state === 'Manual order' ? 'Sort' : state : MONTHS[month - 1]}
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
    </button>
  );
}
