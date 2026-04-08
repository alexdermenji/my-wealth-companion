import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { LoginForm } from "./LoginForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

interface AuthContextType {
  session: Session | null;
  authenticated: boolean;
  logout: () => void;
  userName: string | undefined;
}

const AuthContext = createContext<AuthContextType | null>(null);

// E2E mock session — bypasses Supabase entirely when VITE_E2E_TEST=true
const e2eSession: Session = {
  access_token: "e2e-mock-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "e2e-mock-refresh",
  user: {
    id: "e2e-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: { name: "Test User" },
    created_at: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isE2E = import.meta.env.VITE_E2E_TEST === "true";

  const [session, setSession] = useState<Session | null>(isE2E ? e2eSession : null);
  const [loading, setLoading] = useState(!isE2E);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    if (isE2E) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(session);
        setNeedsPasswordReset(true);
      } else {
        if (event === "SIGNED_OUT") {
          window.history.replaceState({}, "", "/");
        }
        setNeedsPasswordReset(false);
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [isE2E]);

  const logout = () => supabase.auth.signOut();

  const userName =
    session?.user.user_metadata?.name ??
    session?.user.user_metadata?.full_name ??
    session?.user.email;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Authenticating...</div>
      </div>
    );
  }

  if (needsPasswordReset) {
    return <ResetPasswordForm onDone={() => setNeedsPasswordReset(false)} />;
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <AuthContext.Provider value={{ session, authenticated: true, logout, userName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
