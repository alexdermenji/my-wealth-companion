import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useBudgetNav } from './BudgetNavContext';

interface BudgetCellProps {
  value: number;
  onChange: (value: string) => void;
  rowKey?: string;
  colIndex?: number;
  className?: string;
}

const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function formatEditing(raw: string): string {
  // Allow trailing dot or trailing zeros after dot (e.g. "1,000." or "1,000.5")
  const trailingDot = raw.endsWith('.');
  const num = parseFloat(raw.replace(/,/g, ''));
  if (isNaN(num)) return raw;
  const formatted = fmt.format(num);
  return trailingDot ? formatted + '.' : formatted;
}

function toRawNumber(formatted: string): string {
  return formatted.replace(/,/g, '');
}

export function BudgetCell({ value, onChange, rowKey, colIndex, className }: BudgetCellProps) {
  const [local, setLocal] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { register, unregister, navigate } = useBudgetNav();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const activate = useCallback(() => {
    setLocal(value ? fmt.format(value) : '');
    setEditing(true);
  }, [value]);

  useEffect(() => {
    if (!rowKey || colIndex === undefined) return;
    register(rowKey, colIndex, activate);
    return () => unregister(rowKey, colIndex);
  }, [rowKey, colIndex, activate, register, unregister]);

  const display = value === 0 ? '-' : fmt.format(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toRawNumber(e.target.value);
    // Only allow digits and one dot
    if (!/^\d*\.?\d*$/.test(raw)) return;
    const formatted = formatEditing(raw);
    // Preserve cursor position relative to end (commas shift positions)
    const input = e.target;
    const oldLen = input.value.length;
    setLocal(formatted);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const newLen = inputRef.current.value.length;
      const pos = (input.selectionStart ?? oldLen) + (newLen - oldLen);
      inputRef.current.setSelectionRange(pos, pos);
    });
  };

  const commit = () => {
    if (!editing) return;
    const num = parseFloat(toRawNumber(local)) || 0;
    if (num !== value) {
      onChange(toRawNumber(local));
    }
    setEditing(false);
  };

  return (
    <div className={cn('relative flex items-center justify-center w-full h-8', className)}>
      <span
        className={cn(
          'flex items-center justify-center h-full w-full text-sm text-center cursor-pointer rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 select-none',
          value === 0 && 'text-muted-foreground',
          editing && 'invisible',
        )}
        onClick={activate}
      >
        {display}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        style={{ padding: 0, boxSizing: 'border-box' }}
        className={cn(
          'absolute inset-0 h-8 w-full',
          'bg-transparent',
          'text-sm text-center',
          'rounded border border-transparent',
          'outline-none',
          'focus:border-blue-400 dark:focus:border-blue-500',
          editing ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        value={local}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            e.currentTarget.blur();
            if (rowKey && colIndex !== undefined) {
              navigate(rowKey, colIndex, e.shiftKey ? 'left' : 'right');
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
            if (rowKey && colIndex !== undefined) {
              navigate(rowKey, colIndex, 'down');
            }
          } else if (e.key === 'ArrowRight') {
            const inp = e.currentTarget;
            if (inp.selectionStart === inp.value.length) {
              e.preventDefault();
              inp.blur();
              if (rowKey && colIndex !== undefined) {
                navigate(rowKey, colIndex, 'right');
              }
            }
          } else if (e.key === 'ArrowLeft') {
            const inp = e.currentTarget;
            if (inp.selectionStart === 0) {
              e.preventDefault();
              inp.blur();
              if (rowKey && colIndex !== undefined) {
                navigate(rowKey, colIndex, 'left');
              }
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.currentTarget.blur();
            if (rowKey && colIndex !== undefined) {
              navigate(rowKey, colIndex, 'down');
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.currentTarget.blur();
            if (rowKey && colIndex !== undefined) {
              navigate(rowKey, colIndex, 'up');
            }
          } else if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
      />
    </div>
  );
}
