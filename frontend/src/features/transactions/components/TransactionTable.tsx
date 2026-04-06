import type { Transaction } from '../types';
import type { BudgetType } from '@/shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const BUDGET_TYPE_CLASSES: Record<BudgetType, string> = {
  Income:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Expenses: 'bg-red-100 text-red-700 border-red-200',
  Savings:  'bg-blue-100 text-blue-700 border-blue-200',
  Debt:     'bg-orange-100 text-orange-700 border-orange-200',
  Transfer: 'bg-purple-100 text-purple-700 border-purple-200',
};

interface TransactionTableProps {
  transactions: Transaction[];
  getAccountName: (id: string) => string;
  getCategoryName: (id: string) => string;
  formatCurrency: (val: number) => string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({
  transactions,
  getAccountName,
  getCategoryName,
  formatCurrency,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  // Build map: transferPairId → inflow (positive) transaction's accountId
  const inflowMap = new Map<string, string>();
  transactions.forEach(tx => {
    if (tx.transferPairId && tx.amount > 0) inflowMap.set(tx.transferPairId, tx.accountId);
  });

  // Show only outflow side of transfers; all non-transfers shown normally
  const displayRows = transactions.filter(tx => !tx.transferPairId || tx.amount < 0);

  return (
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
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No transactions yet. Click "Add Transaction" to get started.
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map(tx => {
                const isTransfer = !!tx.transferPairId;
                const accountToId = isTransfer ? inflowMap.get(tx.transferPairId!) : undefined;
                const accountLabel = isTransfer
                  ? `${getAccountName(tx.accountId)} → ${getAccountName(accountToId ?? '')}`
                  : getAccountName(tx.accountId);

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{format(parseISO(tx.date), 'dd-MMM-yy')}</TableCell>
                    <TableCell className={cn('font-medium', isTransfer ? 'text-muted-foreground' : tx.amount >= 0 ? 'amount-positive' : 'amount-negative')}>
                      {isTransfer
                        ? formatCurrency(Math.abs(tx.amount))
                        : tx.amount < 0 ? `(${formatCurrency(tx.amount)})` : formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{tx.details}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{accountLabel}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {tx.budgetType
                        ? <Badge className={cn('border', BUDGET_TYPE_CLASSES[tx.budgetType as BudgetType])}>{tx.budgetType}</Badge>
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{isTransfer ? '-' : getCategoryName(tx.budgetPositionId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!isTransfer && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tx)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(tx.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
