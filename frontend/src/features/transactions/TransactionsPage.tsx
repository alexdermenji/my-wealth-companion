import { useState } from 'react';
import { BudgetType } from '@/shared/types';
import type { Transaction } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePaginatedTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useCreateTransfer } from './hooks';
import { useAccounts } from '@/shared/hooks/useAccounts';
import { useCategories } from '@/shared/hooks/useCategories';
import { useSettings } from '@/features/settings/hooks';
import { TransactionForm, FormValues } from './components/TransactionForm';
import { TransactionTable } from './components/TransactionTable';
import { TransactionsSkeleton } from './components/TransactionsSkeleton';

const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt', 'Transfer'];
const OUTFLOW_TYPES: (BudgetType | '')[] = ['Expenses', 'Debt'];
const PAGE_SIZE = 25;
const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: paginatedTransactions, isLoading: txLoading } = usePaginatedTransactions({
    budgetType: filterType !== 'all' ? filterType : undefined,
    accountId: filterAccount !== 'all' ? filterAccount : undefined,
    month: filterMonth !== 'all' ? Number(filterMonth) : undefined,
    year: filterYear !== 'all' ? Number(filterYear) : undefined,
    page,
    pageSize: PAGE_SIZE,
  });
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

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    setPage(1);
  };
  const handleFilterAccountChange = (value: string) => {
    setFilterAccount(value);
    setPage(1);
  };
  const handleFilterMonthChange = (value: string) => {
    setFilterMonth(value);
    setPage(1);
  };
  const handleFilterYearChange = (value: string) => {
    setFilterYear(value);
    setPage(1);
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name ?? 'Unknown';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '-';
  const currency = settings?.currency ?? '$';
  const formatCurrency = (val: number) => `${currency}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const currentYear = new Date().getFullYear();
  const startYear = Math.min(settings?.startYear ?? currentYear, currentYear);
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, index) => String(currentYear - index));
  const transactions = paginatedTransactions?.transactions ?? [];
  const totalCount = paginatedTransactions?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const visibleStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm">{totalCount} transactions recorded</p>
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
        <Select value={filterType} onValueChange={handleFilterTypeChange}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BUDGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAccount} onValueChange={handleFilterAccountChange}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All accounts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={handleFilterMonthChange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All months" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={handleFilterYearChange}>
          <SelectTrigger className="w-32"><SelectValue placeholder="All years" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
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

      {totalCount > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">{visibleStart}-{visibleEnd} of {totalCount}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
