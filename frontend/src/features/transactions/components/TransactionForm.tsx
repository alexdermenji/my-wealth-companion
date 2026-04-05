import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { BudgetType, BudgetCategory, Account } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt', 'Transfer'];

const schema = yup.object({
  date: yup.string().required('Date is required'),
  amount: yup.number().typeError('Amount is required').positive('Must be greater than 0').required('Amount is required'),
  details: yup.string().trim().required('Details are required'),
  accountId: yup.string().required('Account is required'),
  budgetType: yup.string().required('Budget type is required'),
  budgetPositionId: yup.string().required('Budget position is required'),
});

export type FormValues = yup.InferType<typeof schema>;

const freshDefaults: FormValues = {
  date: format(new Date(), 'yyyy-MM-dd'),
  amount: undefined as unknown as number,
  details: '',
  accountId: '',
  budgetType: '',
  budgetPositionId: '',
};

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  accounts: Account[];
  categories: BudgetCategory[];
}

export function TransactionForm({
  open,
  onOpenChange,
  editing,
  defaultValues,
  onSubmit,
  accounts,
  categories,
}: TransactionFormProps) {
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: freshDefaults,
  });

  useEffect(() => {
    if (open) reset(defaultValues ?? freshDefaults);
  }, [open, defaultValues, reset]);

  const budgetType = watch('budgetType');
  const filteredCategories = categories.filter(c => !budgetType || c.type === budgetType);

  const [posOpen, setPosOpen] = useState(false);
  const [posSearch, setPosSearch] = useState('');
  const [posHighlight, setPosHighlight] = useState(0);

  const filteredPositions = filteredCategories.filter(c =>
    c.name.toLowerCase().includes(posSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? 'Edit' : 'New'} Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Input type="date" {...register('date')} className={errors.date ? 'border-destructive' : ''} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" placeholder="e.g. 100" {...register('amount', { valueAsNumber: true })} className={errors.amount ? 'border-destructive' : ''} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Details</Label>
            <Input placeholder="e.g. Tesco groceries" {...register('details')} className={errors.details ? 'border-destructive' : ''} />
            {errors.details && <p className="text-xs text-destructive">{errors.details.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Account</Label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.accountId ? 'border-destructive' : ''}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Budget Type</Label>
              <Controller
                name="budgetType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.budgetType ? 'border-destructive' : ''}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.budgetType && <p className="text-xs text-destructive">{errors.budgetType.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Budget Position</Label>
              <Controller
                name="budgetPositionId"
                control={control}
                render={({ field }) => {
                  const selectedCategory = filteredCategories.find(c => c.id === field.value);
                  return (
                    <div className="relative">
                      <Input
                        placeholder=""
                        value={posOpen ? posSearch : (selectedCategory?.name ?? '')}
                        className={errors.budgetPositionId ? 'border-destructive' : ''}
                        onChange={e => { setPosSearch(e.target.value); setPosHighlight(0); setPosOpen(true); }}
                        onFocus={() => { setPosSearch(''); setPosHighlight(0); setPosOpen(true); }}
                        onBlur={() => setPosOpen(false)}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') { e.preventDefault(); setPosHighlight(i => Math.min(i + 1, filteredPositions.length - 1)); }
                          else if (e.key === 'ArrowUp') { e.preventDefault(); setPosHighlight(i => Math.max(i - 1, 0)); }
                          else if (e.key === 'Enter' && posOpen) {
                            e.preventDefault();
                            const c = filteredPositions[posHighlight];
                            if (c) { field.onChange(c.id); setPosOpen(false); }
                          } else if (e.key === 'Escape') { setPosOpen(false); }
                        }}
                      />
                      {posOpen && filteredPositions.length > 0 && (
                        <div
                          className="absolute z-50 w-full top-full mt-1 rounded-md border bg-popover shadow-md overflow-y-auto max-h-48"
                          onMouseDown={e => e.preventDefault()}
                        >
                          {filteredPositions.map((c, i) => (
                            <div
                              key={c.id}
                              className={cn('flex items-center px-3 py-2 cursor-pointer text-sm select-none', i === posHighlight ? 'bg-accent' : 'hover:bg-accent')}
                              onClick={() => { field.onChange(c.id); setPosOpen(false); }}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === c.id ? 'opacity-100' : 'opacity-0')} />
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {errors.budgetPositionId && <p className="text-xs text-destructive">{errors.budgetPositionId.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full">{editing ? 'Update' : 'Add'} Transaction</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
