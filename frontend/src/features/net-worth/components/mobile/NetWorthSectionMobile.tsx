import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BudgetCell } from '@/features/budget/components/BudgetCell';
import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteNetWorthItem, useNetWorthHeatMap, useNetWorthTabFill } from '../../hooks';
import { SECTION_ACCENT, SECTION_CSS_KEY } from '../../constants';
import type { NetWorthItem, NetWorthType, NetWorthValue } from '../../types';
import { ItemFormDialog } from '../ItemFormDialog';

interface NetWorthSectionMobileProps {
  type: NetWorthType;
  items: NetWorthItem[];
  values: NetWorthValue[];
  onAmountChange: (itemId: string, month: number, value: string) => void;
  currency: string;
  month: number;
  existingGroups: string[];
  currentMonth?: number | null;
}

const DISPLAY_LABELS: Record<NetWorthType, string> = {
  Asset: 'Assets',
  Liability: 'Liabilities',
};

function getTrendDirection(current: number, previous: number): 'up' | 'down' | null {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return null;
}

export function NetWorthSectionMobile({
  type,
  items,
  values,
  onAmountChange,
  currency,
  month,
  existingGroups,
  currentMonth = null,
}: NetWorthSectionMobileProps) {
  const accentColor = SECTION_ACCENT[type];
  const cssKey = SECTION_CSS_KEY[type];
  const displayLabel = DISPLAY_LABELS[type];
  const totalText = `var(--nw-${cssKey}-header-text)`;

  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<NetWorthItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<NetWorthItem | null>(null);

  const deleteItemMutation = useDeleteNetWorthItem();

  const typeItems = useMemo(
    () => items.filter(item => item.type === type).sort((a, b) => a.order - b.order),
    [items, type],
  );

  const { tabFills, getValue } = useNetWorthTabFill({ values, onAmountChange });
  const { monthTotals } = useNetWorthHeatMap({ typeItems, values, tabFills, cssKey });
  const shouldShowTrend = currentMonth === null || month <= currentMonth;

  const fmt = (value: number) => (
    value > 0
      ? `${currency}${new Intl.NumberFormat('en-US').format(value)}`
      : '—'
  );

  const handleDelete = () => {
    if (!deletingItem) return;
    deleteItemMutation.mutate(deletingItem.id, { onSuccess: () => setDeletingItem(null) });
  };

  return (
    <>
      <div className="mb-5">
        <div className="flex items-center justify-between pl-1 pr-[50px] mb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              {displayLabel}
            </span>
          </div>
          <span className="font-display text-sm font-bold" style={{ color: totalText }}>
            {fmt(monthTotals[month] ?? 0)}
          </span>
        </div>

        <Card className="overflow-hidden" style={{ borderLeft: `3px solid ${accentColor}` }}>
          {typeItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between pl-4 pr-1 py-3',
                index < typeItems.length - 1 && 'border-b border-border/40',
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-2">
                <span className="text-[10px] italic text-muted-foreground leading-tight truncate">
                  {item.group || item.name}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-24">
                  <BudgetCell
                    value={getValue(item.id, month)}
                    onChange={value => onAmountChange(item.id, month, value)}
                    tabHint={false}
                    accentColor={accentColor}
                    trendDirection={month > 1 && shouldShowTrend
                      ? getTrendDirection(getValue(item.id, month), getValue(item.id, month - 1))
                      : null}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center min-h-[44px] min-w-[36px] rounded text-muted-foreground/50">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingItem(item)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingItem(item)}
                      className="text-[hsl(var(--expense))] focus:text-[hsl(var(--expense))]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          <div className={cn('px-4 py-3', typeItems.length > 0 && 'border-t border-border/40')}>
            <button
              className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary w-full justify-center"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3 w-3" />
              Add item
            </button>
          </div>
        </Card>
      </div>

      <AlertDialog open={!!deletingItem} onOpenChange={open => { if (!open) setDeletingItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the item and all of its saved net worth values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ItemFormDialog open={adding} onOpenChange={setAdding} type={type} existingGroups={existingGroups} />
      <ItemFormDialog
        open={!!editingItem}
        onOpenChange={open => { if (!open) setEditingItem(null); }}
        type={type}
        existingGroups={existingGroups}
        editingItem={editingItem}
      />
    </>
  );
}
