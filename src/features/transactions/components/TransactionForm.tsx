import { BudgetType, BudgetCategory, Account } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

const BUDGET_TYPES: (BudgetType | '')[] = ['Income', 'Expenses', 'Savings', 'Debt', 'Transfer', ''];

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: {
    date: string;
    amount: string;
    details: string;
    accountId: string;
    budgetType: BudgetType | '';
    budgetPositionId: string;
  };
  onFormChange: (updater: (prev: TransactionFormProps['form']) => TransactionFormProps['form']) => void;
  onSubmit: () => void;
  onReset: () => void;
  accounts: Account[];
  filteredCategories: BudgetCategory[];
}

export function TransactionForm({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSubmit,
  onReset,
  accounts,
  filteredCategories,
}: TransactionFormProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onReset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? 'Edit' : 'New'} Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => onFormChange(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" step="0.01" placeholder="-100.00" value={form.amount} onChange={e => onFormChange(f => ({ ...f, amount: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Negative = outflow</p>
            </div>
          </div>
          <div>
            <Label>Details</Label>
            <Input placeholder="e.g. Walmart groceries" value={form.details} onChange={e => onFormChange(f => ({ ...f, details: e.target.value }))} />
          </div>
          <div>
            <Label>Account</Label>
            <Select value={form.accountId} onValueChange={v => onFormChange(f => ({ ...f, accountId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Type</Label>
              <Select value={form.budgetType || 'none'} onValueChange={v => onFormChange(f => ({ ...f, budgetType: v === 'none' ? '' : v as BudgetType, budgetPositionId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BUDGET_TYPES.map(t => <SelectItem key={t || 'none'} value={t || 'none'}>{t || '- None -'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget Position</Label>
              <Select value={form.budgetPositionId} onValueChange={v => onFormChange(f => ({ ...f, budgetPositionId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={onSubmit}>{editing ? 'Update' : 'Add'} Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
