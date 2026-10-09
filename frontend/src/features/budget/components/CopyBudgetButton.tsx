import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { budgetPlansApi } from '../api';

export function CopyBudgetButton({ year, onCopied }: { year: number; onCopied: () => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const copy = useMutation({
    mutationFn: () => budgetPlansApi.copyToJanuary(year),
    onSuccess: async ({ copiedCount, sourceCount }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgetPlans'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      setOpen(false);
      if (copiedCount > 0) {
        onCopied();
        toast.success(`Copied ${copiedCount} ${copiedCount === 1 ? 'amount' : 'amounts'} to January ${year}`);
      } else {
        toast.info(sourceCount === 0
          ? `No visible December ${year - 1} amounts to copy`
          : `January ${year} already has these amounts. Nothing changed.`);
      }
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={next => {
      if (copy.isPending) return;
      copy.reset();
      setOpen(next);
    }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-primary">
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy December to January
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Fill January {year}?</AlertDialogTitle>
          <AlertDialogDescription>
            Copy your December {year - 1} amounts.<br />
            Existing January amounts stay unchanged, including zero.<br />
            Hidden categories are skipped.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {copy.isError && <p role="alert" className="text-sm text-destructive">Couldn’t copy the budget. Please try again.</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={copy.isPending}>Cancel</AlertDialogCancel>
          <Button disabled={copy.isPending} onClick={() => copy.mutate()}>
            {copy.isPending ? 'Copying…' : 'Copy amounts'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
