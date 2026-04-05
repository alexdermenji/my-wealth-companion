import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS, BudgetType, BudgetCategory } from '@/shared/types';
import type { BudgetPlan } from '../types';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BudgetCell } from './BudgetCell';
import { GripVertical, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CategoryFormDialog } from '@/features/settings/components/CategoryFormDialog';
import { useForceDeleteCategory, useReorderCategory } from '@/shared/hooks/useCategories';

const DISPLAY_LABELS: Partial<Record<BudgetType, string>> = {
  Debt: 'Liabilities',
};

// Raw accent hex values — must be hex (not CSS vars) so they can be used
// in inline style gradients and opacity suffixes (e.g. `${color}80`)
const SECTION_ACCENT: Record<string, string> = {
  Income:   '#10b981',
  Expenses: '#ec4899',
  Savings:  '#6c5ce7',
  Debt:     '#0ea5e9',
};

// Distinct lighter bg for total row (matches Storybook totalBg per section)
const TOTAL_BG: Record<string, string> = {
  Income:   '#f0fdf8',
  Expenses: '#fdf2f8',
  Savings:  '#f5f3ff',
  Debt:     '#f0f9ff',
};

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface BudgetSectionProps {
  type: BudgetType;
  categories: BudgetCategory[];
  budgetPlans: BudgetPlan[];
  onAmountChange: (catId: string, month: number, value: string) => void;
  currency?: string;
}

export function BudgetSection({
  type,
  categories,
  budgetPlans,
  onAmountChange,
  currency = '£',
}: BudgetSectionProps) {
  const visibleMonths = ALL_MONTHS;
  const accentColor = SECTION_ACCENT[type];
  const totalBg = TOTAL_BG[type];
  const displayLabel = DISPLAY_LABELS[type] ?? type;
  const [adding, setAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<BudgetCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<BudgetCategory | null>(null);
  const forceDeleteMutation = useForceDeleteCategory();
  const reorderMutation = useReorderCategory();

  // Refs to every BudgetCell input, keyed by `${catId}|${month}`
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Optimistic values applied by Tab-fill before the mutation round-trips.
  // Key: `${catId}|${month}`, value: raw numeric string (no commas).
  const [tabFills, setTabFills] = useState<Record<string, string>>({});

  // Once React Query returns real data for a tab-filled cell, drop the optimistic entry.
  useEffect(() => {
    if (Object.keys(tabFills).length === 0) return;
    setTabFills(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        const [catId, monthStr] = key.split('|');
        const plan = budgetPlans.find(bp => bp.categoryId === catId);
        if ((plan?.months[parseInt(monthStr, 10)] ?? 0) > 0) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [budgetPlans]); // eslint-disable-line react-hooks/exhaustive-deps

  const typeCats = useMemo(
    () => categories.filter(c => c.type === type).sort((a, b) => a.order - b.order),
    [categories, type],
  );

  // Optimistic local order — set on drop, cleared once server data syncs back
  const [optimisticCats, setOptimisticCats] = useState<BudgetCategory[] | null>(null);
  const displayCats = optimisticCats ?? typeCats;

  // Drag state — dropLineIndex is the gap index (0 = before first row, n = after last)
  const dragIndexRef = useRef<number | null>(null);
  const [dropLineIndex, setDropLineIndex] = useState<number | null>(null);

  const colSpan = visibleMonths.length + 2;

  const existingGroups = useMemo(
    () => [...new Set(categories.map(c => c.group).filter(Boolean))].sort(),
    [categories],
  );

  const getBudget = (catId: string, month: number): number => {
    const fill = tabFills[`${catId}|${month}`];
    if (fill !== undefined) return parseFloat(fill) || 0;
    const plan = budgetPlans.find(bp => bp.categoryId === catId);
    return plan?.months[month] ?? 0;
  };

  // Shift+Tab: fill the next empty month with the current value and advance focus.
  // Regular Tab is left to the browser (no interception).
  const handleTab = (catId: string, month: number, value: string) => {
    if (month >= 12) return; // Dec — end of year

    const nextMonth = month + 1;
    if (value && getBudget(catId, nextMonth) === 0) {
      // Fill the next empty cell optimistically so onFocus sees the value immediately
      setTabFills(prev => ({ ...prev, [`${catId}|${nextMonth}`]: value }));
      onAmountChange(catId, nextMonth, value);
      // Defer focus so React can flush the state update before onFocus reads it
      setTimeout(() => cellRefs.current[`${catId}|${nextMonth}`]?.focus(), 0);
    } else {
      // Next cell already has a value — just move focus, never overwrite
      cellRefs.current[`${catId}|${nextMonth}`]?.focus();
    }
  };

  const getMonthTotal = (month: number) =>
    typeCats.reduce((s, c) => s + getBudget(c.id, month), 0);

  const fmt = (v: number) => v > 0 ? `${currency}${new Intl.NumberFormat('en-US').format(v)}` : '—';

  const handleDelete = () => {
    if (!deletingCat) return;
    forceDeleteMutation.mutate(deletingCat.id, { onSuccess: () => setDeletingCat(null) });
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    // Gap before this row if cursor is in top half, gap after if in bottom half
    setDropLineIndex(e.clientY < midY ? index : index + 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dropLineIndex === null) {
      dragIndexRef.current = null;
      setDropLineIndex(null);
      return;
    }

    // Compute destination index after removing the dragged item
    let dest = dropLineIndex > dragIndex ? dropLineIndex - 1 : dropLineIndex;
    dest = Math.max(0, Math.min(dest, displayCats.length - 1));

    if (dest === dragIndex) {
      dragIndexRef.current = null;
      setDropLineIndex(null);
      return;
    }

    // Optimistic reorder
    const reordered = [...displayCats];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dest, 0, moved);
    setOptimisticCats(reordered);

    dragIndexRef.current = null;
    setDropLineIndex(null);

    // Persist to backend; clear optimistic state once server data arrives
    reorderMutation.mutate(
      { id: moved.id, newOrder: dest },
      { onSuccess: () => setOptimisticCats(null) },
    );
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropLineIndex(null);
  };

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
            padding: 0,
            height: '1px',
            border: 'none',
            background: `linear-gradient(to right, ${accentColor}80, ${accentColor}40 30%, transparent 70%)`,
          }}
        />
      </tr>

      {/* Section header — bg is secondary (#f8faff), left border is accent color */}
      <TableRow className="bg-secondary border-none">
        <TableCell
          className="sticky left-0 z-10 w-[200px] py-2.5 pl-4 bg-secondary sticky-border-r"
          style={{ borderLeft: `3px solid ${accentColor}` }}
          colSpan={2}
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span
              className="font-display text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              {displayLabel}
            </span>
          </div>
        </TableCell>
        {visibleMonths.map(mo => (
          <TableCell key={mo} className="text-center font-display text-[10px] font-bold uppercase tracking-wider py-2.5 text-muted-foreground bg-secondary border-r border-[#f0f2f8] dark:border-border">
            {MONTHS[mo - 1]}
          </TableCell>
        ))}
      </TableRow>

      {/* Gradient accent line — bottom */}
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

      {/* Category rows */}
      {displayCats.map((cat, index) => (
        <React.Fragment key={cat.id}>
          {/* Drop indicator above this row */}
          {dropLineIndex === index && dragIndexRef.current !== index && dragIndexRef.current !== index - 1 && (
            <tr aria-hidden>
              <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
                <div style={{ position: 'relative', height: '3px', background: accentColor }}>
                  <div style={{
                    position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                    width: '8px', height: '8px', borderRadius: '50%', background: accentColor,
                  }} />
                </div>
              </td>
            </tr>
          )}
          <TableRow
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={e => handleDragOver(e, index)}
            onDrop={handleDrop}
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
                {/* Drag handle */}
                <div
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors mr-2"
                  onMouseDown={e => e.stopPropagation()}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className="text-[10px] italic text-muted-foreground leading-tight truncate">{cat.group || cat.name}</span>
                  <span className="text-sm font-medium text-foreground truncate" title={cat.name}>{cat.name}</span>
                </div>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
            {visibleMonths.map(mo => (
              <TableCell key={mo} className="border-r border-[#f0f2f8] px-1 py-1 dark:border-border">
                <BudgetCell
                  ref={el => { cellRefs.current[`${cat.id}|${mo}`] = el; }}
                  value={getBudget(cat.id, mo)}
                  onChange={v => onAmountChange(cat.id, mo, v)}
                  onTab={v => handleTab(cat.id, mo, v)}
                  tabHint={mo < 12 && getBudget(cat.id, mo) > 0 && getBudget(cat.id, mo + 1) === 0}
                  accentColor={accentColor}
                />
              </TableCell>
            ))}
          </TableRow>
        </React.Fragment>
      ))}
      {/* Drop indicator after the last row */}
      {dropLineIndex === displayCats.length && dragIndexRef.current !== displayCats.length - 1 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
            <div style={{ position: 'relative', height: '3px', background: accentColor }}>
              <div style={{
                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                width: '8px', height: '8px', borderRadius: '50%', background: accentColor,
              }} />
            </div>
          </td>
        </tr>
      )}

      {/* Section total */}
      <TableRow className="border-t border-[#f0f2f8] dark:border-border" style={{ background: totalBg }}>
        <TableCell
          colSpan={2}
          className="sticky left-0 z-10 py-2.5 pl-4 sticky-border-r"
          style={{ background: totalBg }}
        >
          <span
            className="font-display text-[11px] font-bold uppercase tracking-wider"
            style={{ color: accentColor }}
          >
            Total {displayLabel}
          </span>
        </TableCell>
        {visibleMonths.map(mo => (
          <TableCell key={mo} className="px-1 py-2 text-right border-r border-[#f0f2f8] dark:border-border" style={{ background: totalBg }}>
            <span className="font-display text-xs font-bold pr-1" style={{ color: accentColor }}>
              {fmt(getMonthTotal(mo))}
            </span>
          </TableCell>
        ))}
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
      <CategoryFormDialog
        open={adding}
        onOpenChange={setAdding}
        defaultType={type}
        existingGroups={existingGroups}
      />
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
    </>
  );
}
