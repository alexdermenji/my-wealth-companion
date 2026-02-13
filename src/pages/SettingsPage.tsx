import { useState } from 'react';
import { BudgetType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/api/useAccounts';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/api/useCategories';
import { useSettings, useUpdateSettings } from '@/hooks/api/useSettings';

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
  const [catForm, setCatForm] = useState({ name: '', type: 'Expenses' as BudgetType, group: '' });
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const handleCatSubmit = () => {
    if (!catForm.name || !catForm.group) return;
    if (editingCat) {
      updateCategoryMutation.mutate({ id: editingCat, data: catForm });
    } else {
      createCategory.mutate(catForm);
    }
    setCatOpen(false);
    setCatForm({ name: '', type: 'Expenses', group: '' });
    setEditingCat(null);
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
                  <Select value={accForm.type} onValueChange={v => setAccForm(f => ({ ...f, type: v as any }))}>
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

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Budget Categories</CardTitle>
          <Dialog open={catOpen} onOpenChange={(o) => { setCatOpen(o); if (!o) { setEditingCat(null); setCatForm({ name: '', type: 'Expenses', group: '' }); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{editingCat ? 'Edit' : 'New'} Category</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Budget Type</Label>
                  <Select value={catForm.type} onValueChange={v => setCatForm(f => ({ ...f, type: v as BudgetType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Group</Label>
                  <Input placeholder="e.g. Housing, Fun, Self-Care" value={catForm.group} onChange={e => setCatForm(f => ({ ...f, group: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={handleCatSubmit}>{editingCat ? 'Update' : 'Add'}</Button>
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
                <TableHead>Group</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className={`text-${c.type === 'Income' ? 'income' : c.type === 'Expenses' ? 'expense' : c.type === 'Savings' ? 'savings' : 'debt'}`}>{c.type}</TableCell>
                  <TableCell className="text-muted-foreground">{c.group}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCatForm({ name: c.name, type: c.type, group: c.group }); setEditingCat(c.id); setCatOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategoryMutation.mutate(c.id)}>
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
    </div>
  );
}
