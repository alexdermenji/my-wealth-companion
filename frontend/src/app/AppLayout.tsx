import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Settings, TrendingUp, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/shared/auth/AuthProvider';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budget', label: 'Budget Plan', icon: PiggyBank },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { logout, userName } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-display font-bold text-foreground">FinanceFlow</h1>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="border-t px-3 py-4 space-y-2">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate">{userName}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t">
        <nav className="flex justify-around py-2">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
                location.pathname === item.to
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-2 md:p-4 max-w-8xl mx-0">
          {children}
        </div>
      </main>
    </div>
  );
}
