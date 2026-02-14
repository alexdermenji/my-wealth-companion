import type { Transaction } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tx)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(tx.id)}>
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
  );
}
