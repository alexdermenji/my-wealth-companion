import { useState } from 'react';
import { BudgetType, BudgetCategory } from '@/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/shared/hooks/useAccounts';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useForceDeleteCategory } from '@/shared/hooks/useCategories';
import { useSettings, useUpdateSettings } from './hooks';
import { categoriesApi } from '@/shared/api/categoriesApi';
import { CategoryBlock } from './components/CategoryBlock';

const ACCOUNT_TYPES = ['Cash', 'Bank', 'Credit Card', 'Investment', 'Retirement', 'Loan', 'Other'] as const;
const BUDGET_TYPES: BudgetType[] = ['Income', 'Expenses', 'Savings', 'Debt'];

export default function SettingsPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const createAccount = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const createCategory = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const forceDeleteMutation = useForceDeleteCategory();

  // Account form
  const [accOpen, setAccOpen] = useState(false);
  const [accForm, setAccForm] = useState({ name: '', type: 'Bank' as typeof ACCOUNT_TYPES[number] });
  const [editingAcc, setEditingAcc] = useState<string | null>(null);

  const handleAccSubmit = () => {
    if (!accForm.name) return;
    if (editingAcc) {
      updateAccountMutation.mutate({ id: editingAcc, data: accForm });
    } else {
      createAccount.mutate(accForm);
    }
    setAccOpen(false);
    setAccForm({ name: '', type: 'Bank' });
    setEditingAcc(null);
  };

  // Category form
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', type: 'Expenses' as BudgetType, group: '', groupEmoji: '' });
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const handleCatSubmit = () => {
    if (!catForm.name || !catForm.group) return;
    if (editingCat) {
      updateCategoryMutation.mutate({ id: editingCat, data: catForm });
    } else {
      createCategory.mutate(catForm);
    }
    setCatOpen(false);
    setCatForm({ name: '', type: 'Expenses', group: '', groupEmoji: '' });
    setEditingCat(null);
  };

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
    transactionCount: number;
    budgetPlanCount: number;
  } | null>(null);

  const handleDeleteCategory = async (cat: BudgetCategory) => {
    try {
      // Try normal delete first (will fail with 409 if has dependencies)
      await deleteCategoryMutation.mutateAsync(cat.id);
    } catch {
      // Has dependencies — fetch usage and show confirmation
      try {
        const usage = await categoriesApi.getUsage(cat.id);
        setDeleteConfirm({
          id: cat.id,
          name: cat.name,
          transactionCount: usage.transactionCount,
          budgetPlanCount: usage.budgetPlanCount,
        });
      } catch {
        // Category not found or other error — ignore
      }
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      forceDeleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const openCatFormForType = (type: BudgetType) => {
    setCatForm({ name: '', type, group: '', groupEmoji: '' });
    setEditingCat(null);
    setCatOpen(true);
  };

  const openCatFormForEdit = (cat: BudgetCategory) => {
    setCatForm({ name: cat.name, type: cat.type, group: cat.group, groupEmoji: cat.groupEmoji });
    setEditingCat(cat.id);
    setCatOpen(true);
  };

  const handleSettingsChange = (updates: Partial<{ startYear: number; startMonth: number; currency: string }>) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ ...settings, ...updates });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage accounts, categories, and preferences</p>
      </div>

      {/* General settings */}
      <Card>
        <CardHeader><CardTitle className="font-display">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div>
              <Label>Start Year</Label>
              <Input type="number" value={settings?.startYear ?? ''} onChange={e => handleSettingsChange({ startYear: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Start Month</Label>
              <Input type="number" min={1} max={12} value={settings?.startMonth ?? ''} onChange={e => handleSettingsChange({ startMonth: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={settings?.currency ?? ''} onChange={e => handleSettingsChange({ currency: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Accounts</CardTitle>
          <Dialog open={accOpen} onOpenChange={(o) => { setAccOpen(o); if (!o) { setEditingAcc(null); setAccForm({ name: '', type: 'Bank' }); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{editingAcc ? 'Edit' : 'New'} Account</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={accForm.name} onChange={e => setAccForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={accForm.type} onValueChange={v => setAccForm(f => ({ ...f, type: v as typeof ACCOUNT_TYPES[number] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAccSubmit}>{editingAcc ? 'Update' : 'Add'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.type}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAccForm({ name: a.name, type: a.type }); setEditingAcc(a.id); setAccOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAccountMutation.mutate(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Budget Categories — 4 blocks */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Budget Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {BUDGET_TYPES.map(type => (
            <CategoryBlock
              key={type}
              type={type}
              categories={categories.filter(c => c.type === type)}
              onAdd={() => openCatFormForType(type)}
              onEdit={openCatFormForEdit}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      </div>

      {/* Category Add/Edit Dialog */}
      <Dialog open={catOpen} onOpenChange={(o) => { setCatOpen(o); if (!o) { setEditingCat(null); setCatForm({ name: '', type: 'Expenses', group: '', groupEmoji: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingCat ? 'Edit' : 'New'} {catForm.type} Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Group</Label>
                <Input placeholder="e.g. Housing, Fun, Self-Care" value={catForm.group} onChange={e => setCatForm(f => ({ ...f, group: e.target.value }))} />
              </div>
              <div className="w-20">
                <Label>Emoji</Label>
                <Input className="text-center text-lg" placeholder="🏠" value={catForm.groupEmoji} onChange={e => setCatForm(f => ({ ...f, groupEmoji: e.target.value }))} maxLength={2} />
              </div>
            </div>
            <Button className="w-full" onClick={handleCatSubmit}>{editingCat ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteConfirm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This category is used by {deleteConfirm?.transactionCount} transaction{deleteConfirm?.transactionCount !== 1 ? 's' : ''} and {deleteConfirm?.budgetPlanCount} budget entr{deleteConfirm?.budgetPlanCount !== 1 ? 'ies' : 'y'}.
              Deleting it will remove those references.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
