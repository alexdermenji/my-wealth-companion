import { useEffect, useState } from 'react';
import { BudgetType } from '@/shared/types';
import type { Transaction } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from './hooks';
import { useAccounts } from '@/shared/hooks/useAccounts';
import { useCategories } from '@/shared/hooks/useCategories';
import { useSettings } from '@/features/settings/hooks';
import { TransactionForm } from './components/TransactionForm';
import { TransactionTable } from './components/TransactionTable';

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
    accountId: accounts[0]?.id ?? '',
    budgetType: '' as BudgetType | '',
    budgetPositionId: '',
  });

  useEffect(() => {
    if (accounts.length > 0 && !form.accountId) {
      setForm(f => ({ ...f, accountId: accounts[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

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
        data: { ...form, amount, budgetType: form.budgetType },
      });
    } else {
      createTransaction.mutate({
        ...form,
        amount,
        budgetType: form.budgetType,
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

  const filteredCategories = categories.filter(c => !form.budgetType || c.type === form.budgetType);

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
        <TransactionForm
          open={open}
          onOpenChange={setOpen}
          editing={!!editing}
          form={form}
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onReset={resetForm}
          accounts={accounts}
          filteredCategories={filteredCategories}
        />
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

      <TransactionTable
        transactions={transactions}
        getAccountName={getAccountName}
        getCategoryName={getCategoryName}
        formatCurrency={formatCurrency}
        onEdit={handleEdit}
        onDelete={(id) => deleteTransactionMutation.mutate(id)}
      />
    </div>
  );
}
