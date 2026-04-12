import React, { useMemo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
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
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { ALL_MONTHS, SECTION_ACCENT, SECTION_CSS_KEY } from '../constants';
import { useDeleteNetWorthItem, useNetWorthDragReorder, useNetWorthHeatMap, useNetWorthTabFill } from '../hooks';
import type { NetWorthItem, NetWorthType, NetWorthValue } from '../types';
import { ItemFormDialog } from './ItemFormDialog';
import { MONTHS } from '@/shared/types';

interface NetWorthSectionProps {
  type: NetWorthType;
  items: NetWorthItem[];
  values: NetWorthValue[];
  onAmountChange: (itemId: string, month: number, value: string) => void;
  existingGroups: string[];
  currency?: string;
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

export function NetWorthSection({
  type,
  items,
  values,
  onAmountChange,
  existingGroups,
  currency = '£',
  currentMonth = null,
}: NetWorthSectionProps) {
  const accentColor = SECTION_ACCENT[type];
  const cssKey = SECTION_CSS_KEY[type];
  const displayLabel = DISPLAY_LABELS[type];
  const totalBg = `var(--nw-${cssKey}-header-bg)`;
  const totalText = `var(--nw-${cssKey}-header-text)`;

  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<NetWorthItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<NetWorthItem | null>(null);

  const deleteItemMutation = useDeleteNetWorthItem();

  const typeItems = useMemo(
    () => items.filter(item => item.type === type).sort((a, b) => a.order - b.order),
    [items, type],
  );

  const { tabFills, getValue, handleTab, cellRefs } = useNetWorthTabFill({ values, onAmountChange });
  const { displayItems, dropLineIndex, dragIndexRef, handleDragStart, handleDragOver, handleDrop, handleDragEnd } =
    useNetWorthDragReorder(typeItems);
  const { monthTotals, getHeatBg } = useNetWorthHeatMap({ typeItems, values, tabFills, cssKey });

  const handleDelete = () => {
    if (!deletingItem) return;
    deleteItemMutation.mutate(deletingItem.id, { onSuccess: () => setDeletingItem(null) });
  };

  const fmt = (value: number) => (
    value > 0
      ? `${currency}${new Intl.NumberFormat('en-US').format(value)}`
      : '—'
  );

  const colSpan = ALL_MONTHS.length + 2;
  const shouldShowTrendForMonth = (month: number) => currentMonth === null || month <= currentMonth;

  return (
    <>
      <TableRow className="border-none">
        <TableCell colSpan={colSpan} className="p-1.5 border-none" />
      </TableRow>

      <tr aria-hidden>
        <td
          colSpan={colSpan}
          style={{
            padding: 0,
            height: '1px',
            border: 'none',
            background: `linear-gradient(to right, ${accentColor}80, ${accentColor}40 30%, transparent 70%)`,
          }}
        />
      </tr>

      <TableRow className="bg-secondary border-none">
        <TableCell
          className="sticky left-0 z-10 w-[200px] py-2.5 pl-4 bg-secondary sticky-border-r"
          style={{ borderLeft: `3px solid ${accentColor}` }}
          colSpan={2}
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span className="font-display text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
              {displayLabel}
            </span>
          </div>
        </TableCell>
        {ALL_MONTHS.map(month => (
          <TableCell
            key={month}
            data-current-month={currentMonth === month ? 'true' : undefined}
            className={cn(
              'text-center font-display text-[10px] font-bold uppercase tracking-wider py-2.5 text-muted-foreground bg-secondary border-r border-[#f0f2f8] dark:border-border',
              currentMonth === month && 'bg-[hsl(var(--warning)/0.14)] text-foreground shadow-[inset_0_1px_0_hsl(var(--warning)/0.45),inset_0_-1px_0_hsl(var(--warning)/0.45)]',
            )}
          >
            {MONTHS[month - 1]}
          </TableCell>
        ))}
      </TableRow>

      <tr aria-hidden>
        <td
          colSpan={colSpan}
          style={{
            padding: 0,
            height: '1px',
            border: 'none',
            background: `linear-gradient(to right, ${accentColor}, ${accentColor}80 30%, transparent 70%)`,
          }}
        />
      </tr>

      {displayItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {dropLineIndex === index && dragIndexRef.current !== index && dragIndexRef.current !== index - 1 && (
            <tr aria-hidden>
              <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
                <div style={{ position: 'relative', height: '3px', background: accentColor }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: accentColor,
                    }}
                  />
                </div>
              </td>
            </tr>
          )}

          <TableRow
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={event => handleDragOver(event, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className="group/row border-t border-[#f0f2f8] hover:bg-[#fafbff] bg-card dark:border-border dark:hover:bg-muted/30"
          >
            <TableCell
              className="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] bg-card py-2 cursor-default sticky-border-r"
              style={{ borderLeft: '3px solid transparent' }}
              colSpan={2}
              onMouseEnter={event => { event.currentTarget.style.borderLeftColor = accentColor; }}
              onMouseLeave={event => { event.currentTarget.style.borderLeftColor = 'transparent'; }}
            >
              <div className="relative flex items-center h-full pl-0 pr-6">
                <div
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors mr-2"
                  onMouseDown={event => event.stopPropagation()}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className="text-[10px] italic text-muted-foreground leading-tight truncate">{item.group || item.name}</span>
                  <span className="text-sm font-medium text-foreground truncate" title={item.name}>{item.name}</span>
                </div>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
                        <MoreVertical className="h-3.5 w-3.5" />
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
            </TableCell>

            {ALL_MONTHS.map(month => (
              <TableCell
                key={month}
                data-current-month={currentMonth === month ? 'true' : undefined}
                className={cn(
                  'border-r border-[#f0f2f8] px-1 py-1 dark:border-border',
                  currentMonth === month && 'bg-[hsl(var(--warning)/0.06)]',
                )}
              >
                <BudgetCell
                  ref={element => { cellRefs.current[`${item.id}|${month}`] = element; }}
                  value={getValue(item.id, month)}
                  onChange={value => onAmountChange(item.id, month, value)}
                  onTab={value => handleTab(item.id, month, value)}
                  tabHint={month < 12 && getValue(item.id, month) > 0 && getValue(item.id, month + 1) === 0}
                  accentColor={accentColor}
                  trendDirection={month > 1 && shouldShowTrendForMonth(month)
                    ? getTrendDirection(getValue(item.id, month), getValue(item.id, month - 1))
                    : null}
                />
              </TableCell>
            ))}
          </TableRow>
        </React.Fragment>
      ))}

      {dropLineIndex === displayItems.length && dragIndexRef.current !== displayItems.length - 1 && displayItems.length > 0 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
            <div style={{ position: 'relative', height: '3px', background: accentColor }}>
              <div
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: accentColor,
                }}
              />
            </div>
          </td>
        </tr>
      )}

      <TableRow className="border-t border-[#f0f2f8] dark:border-border" style={{ background: totalBg }}>
        <TableCell colSpan={2} className="sticky left-0 z-10 py-2.5 pl-4 sticky-border-r" style={{ background: totalBg }}>
          <span className="font-display text-[11px] font-bold uppercase tracking-wider" style={{ color: totalText }}>
            Total {displayLabel}
          </span>
        </TableCell>
        {ALL_MONTHS.map(month => (
          <TableCell
            key={month}
            data-current-month={currentMonth === month ? 'true' : undefined}
            className={cn(
              'px-1 py-2 text-right border-r border-[#f0f2f8] dark:border-border',
              currentMonth === month && 'shadow-[inset_0_1px_0_hsl(var(--warning)/0.35),inset_0_-1px_0_hsl(var(--warning)/0.35)]',
            )}
            style={{ background: getHeatBg(month, totalBg) }}
          >
            <span className="font-amount text-xs font-bold pr-1" style={{ color: totalText }}>
              {fmt(monthTotals[month] ?? 0)}
            </span>
          </TableCell>
        ))}
      </TableRow>

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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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

      <TableRow className="border-t border-[#f0f2f8] dark:border-border">
        <TableCell className="py-2 pl-3 border-none sticky left-0 bg-card" colSpan={2}>
          <button
            className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add item
          </button>
        </TableCell>
      </TableRow>
    </>
  );
}
