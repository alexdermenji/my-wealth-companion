import { forwardRef, useCallback, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetCellProps {
  value: number;
  onChange: (value: string) => void;
  /** Called when Shift+Tab is pressed. Receives the stripped numeric string. Regular Tab is left to the browser. */
  onTab?: (value: string) => void;
  /** When true, shows a subtle "⇧ Tab →" hint while the cell is focused (signals that Shift+Tab will fill the next month). */
  tabHint?: boolean;
  accentColor?: string;
  className?: string;
  trendDirection?: 'up' | 'down' | null;
  displayFormatOptions?: Intl.NumberFormatOptions;
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
function blurDisplay(v: number, formatOptions?: Intl.NumberFormatOptions): string {
  if (v === 0) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...formatOptions,
  }).format(v);
}

export const BudgetCell = forwardRef<HTMLInputElement, BudgetCellProps>(
  function BudgetCell({
    value,
    onChange,
    onTab,
    tabHint,
    accentColor,
    className,
    trendDirection = null,
    displayFormatOptions,
  }, forwardedRef) {
    const [focused, setFocused] = useState(false);
    const [draft, setDraft] = useState('');
    const innerRef = useRef<HTMLInputElement>(null);

    // Merge the internal ref (for cursor management) with the forwarded ref (for parent focus control)
    const mergedRef = useCallback(
      (el: HTMLInputElement | null) => {
        (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        if (typeof forwardedRef === 'function') {
          forwardedRef(el);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }
      },
      [forwardedRef],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target;
      const cursorPos = el.selectionStart ?? 0;

      // How many non-comma characters sit before the cursor in the raw input value
      const rawCharsBefore = el.value.slice(0, cursorPos).replace(/,/g, '').length;

      const formatted = applyCommas(el.value);
      setDraft(formatted);

      // After React re-renders, restore cursor at the same logical raw-char position
      requestAnimationFrame(() => {
        if (!innerRef.current) return;
        if (rawCharsBefore === 0) {
          innerRef.current.setSelectionRange(0, 0);
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
        innerRef.current.setSelectionRange(newPos, newPos);
      });
    };

    return (
      <div className="relative w-full">
        {!focused && trendDirection && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 z-10',
              trendDirection === 'up' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--expense))]',
            )}
          >
            {trendDirection === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
          </span>
        )}
        <input
          ref={mergedRef}
          type="text"
          inputMode="decimal"
          value={focused ? draft : blurDisplay(value, displayFormatOptions)}
          placeholder="—"
          onChange={handleChange}
          onFocus={() => {
            // Initialise draft from the blur display so there's no visual jump on focus.
            // The user can then clear/overwrite the .00 naturally as they type.
            setDraft(value ? blurDisplay(value, displayFormatOptions) : '');
            setFocused(true);
            setTimeout(() => innerRef.current?.select(), 0);
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
              innerRef.current?.blur();
            }
            if (e.key === 'Tab' && e.shiftKey) {
              e.preventDefault();
              // Pass the raw numeric string (commas stripped) so callers can parseFloat safely
              const numericValue = draft.replace(/,/g, '');
              // Blur first so onBlur commits the current value before we move focus
              innerRef.current?.blur();
              onTab?.(numericValue);
            }
          }}
          className={cn(
            'h-8 w-full rounded pl-1 text-right text-xs font-medium',
            trendDirection ? 'pr-5' : 'px-1',
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
        {tabHint && focused && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20',
              'flex items-center whitespace-nowrap',
              'rounded border border-primary/20 bg-background px-1 py-px shadow-sm',
              'font-mono text-[8px] font-semibold text-primary/55',
            )}
          >
            ⇧ Tab →
          </span>
        )}
      </div>
    );
  },
);
