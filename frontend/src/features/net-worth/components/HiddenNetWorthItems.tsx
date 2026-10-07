import { useId, useState, type Ref } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import type { NetWorthItem } from '../types';
import { cn } from '@/lib/utils';

interface HiddenNetWorthItemsProps {
  items: NetWorthItem[];
  section: string;
  pendingIds: Set<string>;
  onRestore: (id: string) => void;
  buttonRef: Ref<HTMLButtonElement>;
}

// Mount only when at least one item is hidden, so a new Hidden block starts collapsed.
export function HiddenNetWorthItems({ items, section, pendingIds, onRestore, buttonRef }: HiddenNetWorthItemsProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <div className="py-1">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${section}: Hidden (${items.length})`}
        onClick={() => setOpen(previous => !previous)}
        className="flex min-h-11 items-center gap-2 rounded px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
        Hidden ({items.length})
        <ChevronDown aria-hidden="true" className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      <div id={listId} hidden={!open}>
        <p className="px-3 pb-2 text-xs text-muted-foreground">History and totals are preserved.</p>
        <ul className="space-y-1 pb-2">
          {items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pendingIds.has(item.id)}
                aria-label={`Restore ${item.name}${item.group ? ` (${item.group})` : ''}`}
                onClick={() => onRestore(item.id)}
                className="flex min-h-11 w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left hover:bg-muted/60 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="min-w-0">
                  {item.group && <span className="block truncate text-[10px] italic text-muted-foreground">{item.group}</span>}
                  <span className="block truncate text-sm text-foreground">{item.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-primary">
                  <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                  {pendingIds.has(item.id) ? 'Restoring…' : 'Restore'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
