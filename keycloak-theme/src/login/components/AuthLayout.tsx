import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  subtitle?: string;
}

export function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              FinanceFlow
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
