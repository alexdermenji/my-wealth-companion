import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, TrendingUp, Plus, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionForm, FormValues } from '@/features/transactions/components/TransactionForm';
import { useAccounts } from '@/shared/hooks/useAccounts';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateTransaction, useCreateTransfer } from '@/features/transactions/hooks';
import { BudgetType } from '@/shared/types';

const OUTFLOW_TYPES = ['Expenses', 'Debt'];

const navItems = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/budget',       label: 'Budget',       icon: PiggyBank       },
  { to: '/net-worth',    label: 'Net Worth',    icon: TrendingUp      },
  { to: '/timeline',     label: 'Timeline',     icon: CalendarClock   },
];

export function MobileBottomBar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: accounts = [] }   = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const createTransfer    = useCreateTransfer();

  const handleSubmit = (data: FormValues) => {
    if (data.budgetType === 'Transfer') {
      createTransfer.mutate({
        date:        data.date,
        amount:      data.amount,
        details:     data.details,
        accountFromId: data.accountId,
        accountToId:   data.accountToId!,
      });
    } else {
      const signedAmount = OUTFLOW_TYPES.includes(data.budgetType)
        ? -Math.abs(data.amount)
        :  Math.abs(data.amount);
      createTransaction.mutate({
        ...data,
        amount:           signedAmount,
        budgetType:       data.budgetType as BudgetType,
        budgetPositionId: data.budgetPositionId ?? '',
      });
    }
    setOpen(false);
  };

  // Split nav items into two groups so the FAB sits in the centre
  const left  = navItems.slice(0, 2);
  const right = navItems.slice(2);

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border flex items-center h-16 safe-area-pb">
        {/* Left two nav items */}
        {left.map(item => (
          <NavItem key={item.to} item={item} active={location.pathname === item.to} />
        ))}

        {/* Centre spacer for the FAB */}
        <div className="flex-1" />

        {/* Right two nav items */}
        {right.map(item => (
          <NavItem key={item.to} item={item} active={location.pathname === item.to} />
        ))}
      </nav>

      {/* FAB — sits above the bar, centred */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className={cn(
          'md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
          'w-14 h-14 rounded-full bg-primary text-white shadow-lg',
          'flex items-center justify-center',
          'transition-transform active:scale-95',
        )}
        style={{ boxShadow: '0 4px 18px rgba(108,92,231,0.45)' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Transaction dialog */}
      <TransactionForm
        open={open}
        onOpenChange={setOpen}
        editing={false}
        onSubmit={handleSubmit}
        accounts={accounts}
        categories={categories}
        hideTrigger
      />
    </>
  );
}

function NavItem({ item, active }: { item: typeof navItems[number]; active: boolean }) {
  return (
    <Link
      to={item.to}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
