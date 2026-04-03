import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetCellProps {
  value: number;
  onChange: (value: string) => void;
  className?: string;
}

export function BudgetCell({ value, onChange, className }: BudgetCellProps) {
  const [local, setLocal] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const display = value === 0 ? '-' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  return (
    <div className={cn('relative h-8 w-full', className)}>
      <span
        className={cn(
          'block h-8 leading-8 text-sm text-center w-full cursor-pointer rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 select-none',
          value === 0 && 'text-muted-foreground',
          editing && 'invisible',
        )}
        onClick={() => {
          setLocal(value ? value.toString() : '');
          setEditing(true);
        }}
      >
        {display}
      </span>
      {editing && (
        <Input
          ref={inputRef}
          type="number"
          className="absolute inset-0 h-8 text-sm text-center border-blue-400 dark:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={() => {
            const num = parseFloat(local) || 0;
            if (num !== value) {
              onChange(local);
            }
            setEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setEditing(false);
            }
          }}
        />
      )}
    </div>
  );
}
