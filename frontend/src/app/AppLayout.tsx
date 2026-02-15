import { createContext, useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Settings, TrendingUp, LogOut, Menu } from 'lucide-react';

const FullWidthContext = createContext<{ fullWidth: boolean; setFullWidth: React.Dispatch<React.SetStateAction<boolean>> }>({ fullWidth: false, setFullWidth: () => {} });
export const useFullWidth = () => useContext(FullWidthContext);
import { cn } from '@/lib/utils';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budget', label: 'Budget Plan', icon: PiggyBank },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { logout, userName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);

  return (
    <FullWidthContext.Provider value={{ fullWidth, setFullWidth }}>
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2 h-8 w-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mr-8">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-base font-display font-bold text-foreground">FinanceFlow</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors rounded-md',
                  location.pathname === item.to
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {userName && (
                <>
                  <DropdownMenuLabel className="font-normal text-sm">{userName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile slide-out nav */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="h-5 w-5 text-primary" />
              FinanceFlow
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-2 gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  location.pathname === item.to
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t p-4">
            {userName && (
              <p className="text-sm text-muted-foreground mb-3 truncate">{userName}</p>
            )}
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className={cn('mx-auto px-4 md:px-6 py-6', !fullWidth && 'max-w-7xl')}>
        {children}
      </main>
    </div>
    </FullWidthContext.Provider>
  );
}
