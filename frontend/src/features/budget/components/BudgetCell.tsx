import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface BudgetCellProps {
  value: number;
  onChange: (value: string) => void;
  accentColor?: string;
  className?: string;
}

/** Add thousand-separator commas, preserve a single decimal point */
function applyCommas(raw: string): string {
  // Strip everything except digits and a single decimal
  const clean = raw.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
  const [int = '', dec] = clean.split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
}

/** Formatted value shown while the cell is blurred */
function blurDisplay(v: number): string {
  if (v === 0) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function BudgetCell({ value, onChange, accentColor, className }: BudgetCellProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const cursorPos = el.selectionStart ?? 0;

    // How many non-comma characters sit before the cursor in the raw input value
    const rawCharsBefore = el.value.slice(0, cursorPos).replace(/,/g, '').length;

    const formatted = applyCommas(el.value);
    setDraft(formatted);

    // After React re-renders, restore cursor at the same logical raw-char position
    requestAnimationFrame(() => {
      if (!ref.current) return;
      if (rawCharsBefore === 0) {
        ref.current.setSelectionRange(0, 0);
        return;
      }
      let count = 0;
      let newPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ',') count++;
        if (count === rawCharsBefore) {
          newPos = i + 1;
          break;
        }
      }
      ref.current.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={focused ? draft : blurDisplay(value)}
      placeholder="—"
      onChange={handleChange}
      onFocus={() => {
        // Initialise draft from the blur display so there's no visual jump on focus.
        // The user can then clear/overwrite the .00 naturally as they type.
        setDraft(value ? blurDisplay(value) : '');
        setFocused(true);
        setTimeout(() => ref.current?.select(), 0);
      }}
      onBlur={() => {
        setFocused(false);
        const num = parseFloat(draft.replace(/,/g, '')) || 0;
        if (num !== value) onChange(draft.replace(/,/g, ''));
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setFocused(false);
          ref.current?.blur();
        }
      }}
      className={cn(
        'h-8 w-full rounded px-1 text-right text-xs font-medium',
        'bg-transparent text-foreground',
        'border border-transparent',
        'hover:border-[#dde3f0]',
        'outline-none focus:border-[#dde3f0]',
        'focus:ring-1 focus:ring-offset-0',
        !focused && value === 0 && 'text-muted-foreground',
        '[&::-webkit-inner-spin-button]:appearance-none',
        '[&::-webkit-outer-spin-button]:appearance-none',
        '[-moz-appearance:textfield]',
        className,
      )}
      style={accentColor ? ({ '--tw-ring-color': accentColor } as React.CSSProperties) : undefined}
    />
  );
}
