import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetCellProps {
  value: number;
  onChange: (value: string) => void;
  className?: string;
}

export function BudgetCell({ value, onChange, className }: BudgetCellProps) {
  const [local, setLocal] = useState(value ? value.toString() : '');

  useEffect(() => {
    setLocal(value ? value.toString() : '');
  }, [value]);

  return (
    <Input
      type="number"
      className={cn("h-8 text-sm text-center w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]", className)}
      value={local}
      placeholder="0"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== (value ? value.toString() : '')) {
          onChange(local);
        }
      }}
    />
  );
}
