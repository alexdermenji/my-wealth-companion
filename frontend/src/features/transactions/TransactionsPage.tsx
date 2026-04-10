import { useState } from 'react';
import { BudgetType } from '@/shared/types';
import type { Transaction } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useCreateTransfer } from './hooks';
import { useAccounts } from '@/shared/hooks/useAccounts';
import { useCategories } from '@/shared/hooks/useCategories';
import { useSettings } from '@/features/settings/hooks';
import { TransactionForm, FormValues } from './components/TransactionForm';
import { TransactionTable } from './components/TransactionTable';
import { TransactionsSkeleton } from './components/TransactionsSkeleton';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt', 'Transfer'];
const OUTFLOW_TYPES: (BudgetType | '')[] = ['Expenses', 'Debt'];

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  const { data: transactions = [], isLoading: txLoading } = useTransactions(
    filterType !== 'all' || filterAccount !== 'all'
      ? { budgetType: filterType !== 'all' ? filterType : undefined, accountId: filterAccount !== 'all' ? filterAccount : undefined }
      : undefined
  );
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: settings } = useSettings();
  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (txLoading || accountsLoading || categoriesLoading) return <TransactionsSkeleton />;

  const handleSubmit = (data: FormValues) => {
    if (data.budgetType === 'Transfer' && !editing) {
      createTransfer.mutate({
        date: data.date,
        amount: data.amount,
        details: data.details,
        accountFromId: data.accountId,
        accountToId: data.accountToId!,
      });
    } else {
      const signedAmount = OUTFLOW_TYPES.includes(data.budgetType as BudgetType | '')
        ? -Math.abs(data.amount)
        : Math.abs(data.amount);
      const payload = { ...data, amount: signedAmount, budgetType: data.budgetType as BudgetType, budgetPositionId: data.budgetPositionId ?? '' };
      if (editing) {
        updateTransactionMutation.mutate({ id: editing.id, data: payload });
      } else {
        createTransaction.mutate(payload);
      }
    }
    setOpen(false);
    setEditing(null);
  };

  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setOpen(true);
  };

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
          onOpenChange={o => { setOpen(o); if (!o) setEditing(null); }}
          editing={!!editing}
          defaultValues={editing ? {
            date: editing.date,
            amount: Math.abs(editing.amount),
            details: editing.details,
            accountId: editing.accountId,
            budgetType: editing.budgetType,
            budgetPositionId: editing.budgetPositionId,
          } : undefined}
          onSubmit={handleSubmit}
          accounts={accounts}
          categories={categories}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BUDGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
