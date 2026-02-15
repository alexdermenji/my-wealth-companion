import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetCellProps {
  value: number;
  onChange: (value: string) => void;
  className?: string;
}

export function BudgetCell({ value, onChange, className }: BudgetCellProps) {
  const display = (v: number) => v === 0 ? '' : v.toLocaleString();
  const [local, setLocal] = useState(display(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setLocal(display(value));
    }
  }, [value, editing]);

  return (
    <Input
      type={editing ? 'number' : 'text'}
      className={cn("h-8 text-sm text-center w-20 border-gray-300 dark:border-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]", className)}
      value={editing ? local : display(value)}
      onFocus={() => {
        setEditing(true);
        setLocal(value ? value.toString() : '');
      }}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const num = parseFloat(local) || 0;
        if (num !== value) {
          onChange(local);
        }
        setEditing(false);
      }}
    />
  );
}
