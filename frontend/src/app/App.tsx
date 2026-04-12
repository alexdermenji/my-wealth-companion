import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/shared/auth/AuthProvider";
import { AppLayout } from "./AppLayout";
import DashboardPage from "@/features/dashboard/DashboardPage";
import TransactionsPage from "@/features/transactions/TransactionsPage";
import BudgetPlanPage from "@/features/budget/BudgetPlanPage";
import NetWorthPage from "@/features/net-worth/NetWorthPage";
import SettingsPage from "@/features/settings/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budget" element={<BudgetPlanPage />} />
              <Route path="/net-worth" element={<NetWorthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/auth/callback" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
