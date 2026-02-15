import { createContext, useContext, useEffect, useRef, useState } from "react";
import type Keycloak from "keycloak-js";
import keycloak from "./keycloak";

interface AuthContextType {
  keycloak: Keycloak;
  authenticated: boolean;
  logout: () => void;
  userName: string | undefined;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        setLoading(false);

        // Set up token refresh
        setInterval(() => {
          keycloak.updateToken(60).catch(() => {
            keycloak.login();
          });
        }, 30000);
      })
      .catch((err) => {
        console.error("Keycloak init failed", err);
        setLoading(false);
      });
  }, []);

  const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const userName =
    keycloak.tokenParsed?.preferred_username ??
    keycloak.tokenParsed?.name ??
    keycloak.tokenParsed?.email;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Authenticating...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Authentication failed. Please refresh and try again.</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ keycloak, authenticated, logout, userName }}>
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
