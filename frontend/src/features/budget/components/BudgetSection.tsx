import React, { useMemo, useState } from 'react';
import { BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BudgetCell } from './BudgetCell';
import { BudgetSortButton } from './BudgetSortButton';
import { HiddenBudgetItems } from './HiddenBudgetItems';
import { useBudgetVisibility } from '../hooks/useBudgetVisibility';
import { partitionBudgetCategories } from '../visibility';
import { nextBudgetSort, sortBudgetCategories, type BudgetSort } from '../sorting';
import { EyeOff, GripVertical, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CategoryFormDialog } from '@/features/settings/components/CategoryFormDialog';
import { useForceDeleteCategory } from '@/shared/hooks/useCategories';
import { cn } from '@/lib/utils';
import { ALL_MONTHS, DISPLAY_LABELS, SECTION_ACCENT, SECTION_CSS_KEY } from '../constants';
import { useDragReorder, useHeatMap, useTabFill } from '../hooks';

interface BudgetSectionProps {
  type: BudgetType;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  onAmountChange: (catId: string, month: number, value: string) => void;
  currency?: string;
  currentMonth?: number | null;
  sort?: BudgetSort;
  onSortChange?: (sort: BudgetSort) => void;
}

function getTrendDirection(current: number, previous: number): 'up' | 'down' | null {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return null;
}

export function BudgetSection({
  type,
  categories,
  budgetPlans,
  onAmountChange,
  currency = '£',
  currentMonth = null,
  sort: controlledSort,
  onSortChange,
}: BudgetSectionProps) {
  const [localSort, setLocalSort] = useState<BudgetSort>(null);
  const sort = controlledSort === undefined ? localSort : controlledSort;
  const changeSort = onSortChange ?? setLocalSort;
  const accentColor  = SECTION_ACCENT[type];
  const cssKey       = SECTION_CSS_KEY[type];
  const displayLabel = DISPLAY_LABELS[type] ?? type;
  const totalBg      = `var(--budget-${cssKey}-header-bg)`;
  const totalText    = `var(--budget-${cssKey}-header-text)`;

  const [adding, setAdding]           = useState(false);
  const [editingCat, setEditingCat]   = useState<BudgetCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<BudgetCategory | null>(null);

  const forceDeleteMutation = useForceDeleteCategory();

  const typeCats = useMemo(
    () => categories.filter(c => c.type === type).sort((a, b) => a.order - b.order),
    [categories, type],
  );

  const { hidden: hiddenCats } = partitionBudgetCategories(typeCats);
  const visibility = useBudgetVisibility(typeCats);

  const existingGroups = useMemo(
    () => [...new Set(categories.map(c => c.group).filter(Boolean))].sort(),
    [categories],
  );

  const { tabFills, getBudget, handleTab, cellRefs } = useTabFill({ budgetPlans, onAmountChange });

  const { displayCats: manualCats, isReordering, dropLineIndex, dragIndexRef, handleDragStart, handleDragOver, handleDrop, handleDragEnd } =
    useDragReorder(typeCats);
  const displayCats = sortBudgetCategories(manualCats, sort, getBudget);

  const { monthTotals, getHeatBg } = useHeatMap({ typeCats, budgetPlans, tabFills, cssKey });

  const fmt = (v: number) => v > 0 ? `${currency}${new Intl.NumberFormat('en-US').format(v)}` : '—';

  const handleDelete = () => {
    if (!deletingCat) return;
    forceDeleteMutation.mutate(deletingCat.id, { onSuccess: () => setDeletingCat(null) });
  };

  const colSpan = ALL_MONTHS.length + 3;
  const shouldShowTrendForMonth = (month: number) => currentMonth === null || month <= currentMonth;

  return (
    <>
      {/* Spacer row */}
      <TableRow className="border-none">
        <TableCell colSpan={colSpan} className="p-1.5 border-none" />
      </TableRow>

      {/* Gradient accent line — top */}
      <tr aria-hidden>
        <td
          colSpan={colSpan}
          style={{
            padding: 0, height: '1px', border: 'none',
            background: `linear-gradient(to right, ${accentColor}80, ${accentColor}40 30%, transparent 70%)`,
          }}
        />
      </tr>

      {/* Section header */}
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
        {ALL_MONTHS.map(mo => (
          <TableCell
            key={mo}
            role="columnheader"
            aria-sort={sort?.month === mo ? sort.direction : 'none'}
            data-current-month={currentMonth === mo ? 'true' : undefined}
            className={cn(
              'text-center font-display text-[10px] font-bold uppercase tracking-wider py-2.5 text-muted-foreground bg-secondary border-r border-[#f0f2f8] dark:border-border',
              currentMonth === mo && 'bg-[hsl(var(--warning)/0.14)] text-foreground shadow-[inset_0_1px_0_hsl(var(--warning)/0.45),inset_0_-1px_0_hsl(var(--warning)/0.45)]',
            )}
          >
            <BudgetSortButton sort={sort} month={mo} section={displayLabel} onClick={() => changeSort(nextBudgetSort(sort, mo))} />
          </TableCell>
        ))}
        <TableCell role="columnheader" className="min-w-[120px] border-l-2 border-border bg-secondary px-3 py-2.5 text-right font-display text-[10px] font-bold uppercase tracking-wider text-foreground">
          Total
        </TableCell>
      </TableRow>

      {/* Gradient accent line — bottom */}
      <tr aria-hidden>
        <td
          colSpan={colSpan}
          style={{
            padding: 0, height: '1px', border: 'none',
            background: `linear-gradient(to right, ${accentColor}, ${accentColor}80 30%, transparent 70%)`,
          }}
        />
      </tr>

      {/* Category rows */}
      {displayCats.map((cat, index) => (
        <React.Fragment key={cat.id}>
          {/* Drop indicator above this row */}
          {!sort && dropLineIndex === index && dragIndexRef.current !== index && dragIndexRef.current !== index - 1 && (
            <tr aria-hidden>
              <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
                <div style={{ position: 'relative', height: '3px', background: accentColor }}>
                  <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: accentColor }} />
                </div>
              </td>
            </tr>
          )}
          <TableRow
            draggable={!sort && !isReordering}
            onDragStart={sort ? undefined : () => handleDragStart(index)}
            onDragOver={sort ? undefined : e => handleDragOver(e, index)}
            onDrop={sort ? undefined : handleDrop}
            onDragEnd={handleDragEnd}
            className="group/row border-t border-[#f0f2f8] hover:bg-[#fafbff] bg-card dark:border-border dark:hover:bg-muted/30"
          >
            <TableCell
              className="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] bg-card py-2 cursor-default sticky-border-r"
              style={{ borderLeft: '3px solid transparent' }}
              colSpan={2}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = accentColor; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}
            >
              <div className="relative flex items-center h-full pl-0 pr-6">
                <div
                  title={sort ? "Restore manual order to drag categories" : "Drag to reorder"}
                  className={cn("flex-shrink-0 text-muted-foreground/40 transition-colors mr-2", sort ? "cursor-default opacity-30" : "cursor-grab active:cursor-grabbing hover:text-muted-foreground")}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className="text-[10px] italic text-muted-foreground leading-tight truncate">{cat.group || cat.name}</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate" title={cat.name}>{cat.name}</span>
                    {cat.spendingType && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`shrink-0 w-2 h-2 rounded-full ${
                              cat.spendingType === 'want' ? 'bg-amber-400' : 'bg-blue-400'
                            }`} />
                          </TooltipTrigger>
                          <TooltipContent>{cat.spendingType === 'want' ? 'Want' : 'Need'}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button aria-label={`Actions for ${cat.name}`} ref={el => { visibility.rowButtonRefs.current[cat.id] = el; }} className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={visibility.pendingIds.has(cat.id)} onClick={() => visibility.setHidden(cat.id, true)}>
                        <EyeOff className="h-3.5 w-3.5 mr-2" />
                        {visibility.pendingIds.has(cat.id) ? 'Hiding…' : 'Hide'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingCat(cat)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingCat(cat)}
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
            {ALL_MONTHS.map(mo => (
              <TableCell
                key={mo}
                data-current-month={currentMonth === mo ? 'true' : undefined}
                className={cn(
                  'border-r border-[#f0f2f8] px-1 py-1 dark:border-border',
                  currentMonth === mo && 'bg-[hsl(var(--warning)/0.06)]',
                )}
              >
                <BudgetCell
                  ref={el => { cellRefs.current[`${cat.id}|${mo}`] = el; }}
                  value={getBudget(cat.id, mo)}
                  onChange={v => onAmountChange(cat.id, mo, v)}
                  onTab={v => handleTab(cat.id, mo, v)}
                  tabHint={mo < 12 && getBudget(cat.id, mo) > 0 && getBudget(cat.id, mo + 1) === 0}
                  accentColor={accentColor}
                  trendDirection={mo > 1 && shouldShowTrendForMonth(mo)
                    ? getTrendDirection(getBudget(cat.id, mo), getBudget(cat.id, mo - 1))
                    : null}
                />
              </TableCell>
            ))}
            <TableCell data-annual-total className="min-w-[120px] border-l-2 border-border bg-secondary/40 px-3 py-2 text-right font-amount text-sm font-semibold whitespace-nowrap">
              {currency}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ALL_MONTHS.reduce((sum, month) => sum + getBudget(cat.id, month), 0))}
            </TableCell>
          </TableRow>
        </React.Fragment>
      ))}

      {/* Drop indicator after the last row */}
      {!sort && dropLineIndex === displayCats.length && dragIndexRef.current !== displayCats.length - 1 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
            <div style={{ position: 'relative', height: '3px', background: accentColor }}>
              <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: accentColor }} />
            </div>
          </td>
        </tr>
      )}

      {/* Section total row with heat map */}
      <TableRow className="border-t border-[#f0f2f8] dark:border-border" style={{ background: totalBg }}>
        <TableCell colSpan={2} className="sticky left-0 z-10 py-2.5 pl-4 sticky-border-r" style={{ background: totalBg }}>
          <span className="font-display text-[11px] font-bold uppercase tracking-wider" style={{ color: totalText }}>
            Total {displayLabel}
          </span>
        </TableCell>
        {ALL_MONTHS.map(mo => (
          <TableCell
            key={mo}
            data-current-month={currentMonth === mo ? 'true' : undefined}
            className={cn(
              'px-1 py-2 text-right border-r border-[#f0f2f8] dark:border-border',
              currentMonth === mo && 'shadow-[inset_0_1px_0_hsl(var(--warning)/0.35),inset_0_-1px_0_hsl(var(--warning)/0.35)]',
            )}
            style={{ background: getHeatBg(mo, totalBg) }}
          >
            <span className="font-amount text-xs font-bold pr-1" style={{ color: totalText }}>
              {fmt(monthTotals[mo] ?? 0)}
            </span>
          </TableCell>
        ))}
        <TableCell data-annual-total className="min-w-[120px] border-l-2 border-border px-3 py-2 text-right font-amount text-sm font-bold whitespace-nowrap" style={{ color: totalText }}>
          {currency}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ALL_MONTHS.reduce((sum, month) => sum + (monthTotals[month] ?? 0), 0))}
        </TableCell>
      </TableRow>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingCat} onOpenChange={o => { if (!o) setDeletingCat(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingCat?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the category and all its budget data.
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

      {/* Add / Edit dialogs */}
      <CategoryFormDialog open={adding} onOpenChange={setAdding} defaultType={type} existingGroups={existingGroups} />
      <CategoryFormDialog
        open={!!editingCat}
        onOpenChange={o => { if (!o) setEditingCat(null); }}
        editingCategory={editingCat}
        existingGroups={existingGroups}
      />

      {/* Add category button */}
      <TableRow className="border-t border-[#f0f2f8] dark:border-border">
        <TableCell className="py-2 pl-3 border-none sticky left-0 bg-card" colSpan={2}>
          <button
            className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add category
          </button>
        </TableCell>
      </TableRow>
      {hiddenCats.length > 0 && (
        <TableRow className="border-t border-border bg-card">
          <TableCell colSpan={colSpan} className="px-3 py-1">
            <HiddenBudgetItems categories={hiddenCats} section={displayLabel} pendingIds={visibility.pendingIds} buttonRef={visibility.hiddenButtonRef} onRestore={id => visibility.setHidden(id, false)} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
