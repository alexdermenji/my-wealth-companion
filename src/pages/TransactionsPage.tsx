import { useState } from 'react';
import { Transaction, BudgetType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/api/useTransactions';
import { useAccounts } from '@/hooks/api/useAccounts';
import { useCategories } from '@/hooks/api/useCategories';
import { useSettings } from '@/hooks/api/useSettings';

const BUDGET_TYPES: (BudgetType | '')[] = ['Income', 'Expenses', 'Savings', 'Debt', 'Transfer', ''];

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  const { data: transactions = [] } = useTransactions(
    filterType !== 'all' || filterAccount !== 'all'
      ? { budgetType: filterType !== 'all' ? filterType : undefined, accountId: filterAccount !== 'all' ? filterAccount : undefined }
      : undefined
  );
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const createTransaction = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    details: '',
    accountId: '',
    budgetType: '' as BudgetType | '',
    budgetPositionId: '',
  });

  const resetForm = () => {
    setForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      details: '',
      accountId: accounts[0]?.id ?? '',
      budgetType: '',
      budgetPositionId: '',
    });
    setEditing(null);
  };

  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || !form.date || !form.accountId) return;

    if (editing) {
      updateTransactionMutation.mutate({
        id: editing.id,
        data: { ...form, amount, budgetType: form.budgetType === 'none' ? '' : form.budgetType },
      });
    } else {
      createTransaction.mutate({
        ...form,
        amount,
        budgetType: form.budgetType === 'none' ? '' : form.budgetType,
      });
    }
    setOpen(false);
    resetForm();
  };

  const handleEdit = (tx: Transaction) => {
    setForm({
      date: tx.date,
      amount: tx.amount.toString(),
      details: tx.details,
      accountId: tx.accountId,
      budgetType: tx.budgetType,
      budgetPositionId: tx.budgetPositionId,
    });
    setEditing(tx);
    setOpen(true);
  };

  const filteredCategories = categories.filter(c => !form.budgetType || form.budgetType === 'none' || c.type === form.budgetType);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name ?? 'Unknown';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '-';
  const currency = settings?.currency ?? '$';
  const formatCurrency = (val: number) => `${currency}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm">{transactions.length} transactions recorded</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
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
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" placeholder="-100.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Negative = outflow</p>
                </div>
              </div>
              <div>
                <Label>Details</Label>
                <Input placeholder="e.g. Walmart groceries" value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
              </div>
              <div>
                <Label>Account</Label>
                <Select value={form.accountId} onValueChange={v => setForm(f => ({ ...f, accountId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Budget Type</Label>
                  <Select value={form.budgetType || 'none'} onValueChange={v => setForm(f => ({ ...f, budgetType: v === 'none' ? '' : v as BudgetType, budgetPositionId: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_TYPES.map(t => <SelectItem key={t || 'none'} value={t || 'none'}>{t || '- None -'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget Position</Label>
                  <Select value={form.budgetPositionId} onValueChange={v => setForm(f => ({ ...f, budgetPositionId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit}>{editing ? 'Update' : 'Add'} Transaction</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BUDGET_TYPES.filter(Boolean).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAccount} onValueChange={setFilterAccount}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All accounts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Details</TableHead>
                <TableHead className="hidden md:table-cell">Account</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Position</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No transactions yet. Click "Add Transaction" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{format(new Date(tx.date), 'dd-MMM-yy')}</TableCell>
                    <TableCell className={cn('font-medium', tx.amount >= 0 ? 'amount-positive' : 'amount-negative')}>
                      {tx.amount < 0 ? `(${formatCurrency(tx.amount)})` : formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{tx.details}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{getAccountName(tx.accountId)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{tx.budgetType || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{getCategoryName(tx.budgetPositionId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tx)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTransactionMutation.mutate(tx.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
