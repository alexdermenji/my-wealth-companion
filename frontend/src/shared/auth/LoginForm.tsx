import { useState } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { supabase } from "./supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "login" | "signup" | "reset";

const authErrorMessages: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please confirm your email before signing in.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 6 characters.",
  "Unable to validate email address: invalid format": "Please enter a valid email address.",
};

function friendlyError(message: string): string {
  return authErrorMessages[message] ?? message;
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(friendlyError(error.message));
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(friendlyError(error.message));
      else setMessage("Check your email and click the confirmation link to activate your account.");
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) setError(friendlyError(error.message));
      else setMessage("Password reset email sent. Check your inbox.");
    }

    setLoading(false);
  }

  const titles: Record<Mode, string> = {
    login: "Welcome back",
    signup: "Create an account",
    reset: "Reset your password",
  };

  const descriptions: Record<Mode, string> = {
    login: "Sign in to your account to continue",
    signup: "Enter your details to get started",
    reset: "We'll send you a link to reset your password",
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Wallet size={20} />
          </div>
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            My Wealth Companion
          </span>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{titles[mode]}</CardTitle>
            <CardDescription>{descriptions[mode]}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={!!message}
                />
              </div>

              {mode !== "reset" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}

              {!message && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Sign in"
                    : mode === "signup"
                    ? "Create account"
                    : "Send reset email"}
                </Button>
              )}
            </form>

            <div className="mt-4 text-center text-sm space-y-1">
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => switchMode("signup")}
                  >
                    Don't have an account? Sign up
                  </button>
                  <div />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => switchMode("reset")}
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {(mode === "signup" || mode === "reset") && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  onClick={() => switchMode("login")}
                >
                  Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
