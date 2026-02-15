import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginProps = {
  kcContext: Extract<KcContext, { pageId: "login.ftl" }>;
  i18n: I18n;
};

export default function Login({ kcContext }: LoginProps) {
  const { social, realm, url, login, messagesPerField, message } = kcContext;

  return (
    <AuthLayout subtitle="Manage your wealth with confidence">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-display">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Global error message */}
          {message !== undefined && message.type === "error" && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          {/* Success / info messages */}
          {message !== undefined && message.type === "success" && (
            <div className="mb-4 rounded-md border border-success/50 bg-success/10 p-3 text-sm text-success">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          <form action={url.loginAction} method="post" className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-2">
              <Label htmlFor="username">
                {realm.loginWithEmailAllowed
                  ? realm.registrationEmailAsUsername
                    ? "Email"
                    : "Email or Username"
                  : "Username"}
              </Label>
              <Input
                id="username"
                name="username"
                type={realm.loginWithEmailAllowed ? "email" : "text"}
                defaultValue={login.username ?? ""}
                autoComplete="username"
                autoFocus
                placeholder={
                  realm.loginWithEmailAllowed
                    ? "you@example.com"
                    : "Enter your username"
                }
              />
              {messagesPerField.existsError("username") && (
                <p className="text-xs text-destructive">
                  {messagesPerField.get("username")}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {realm.resetPasswordAllowed && (
                  <a
                    href={url.loginResetCredentialsUrl}
                    className="text-xs text-primary hover:underline"
                    tabIndex={5}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              {messagesPerField.existsError("password") && (
                <p className="text-xs text-destructive">
                  {messagesPerField.get("password")}
                </p>
              )}
            </div>

            {/* Remember me */}
            {realm.rememberMe && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  defaultChecked={!!login.rememberMe}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" name="login" id="kc-login">
              Sign in
            </Button>
          </form>

          {/* Social providers */}
          {social?.providers !== undefined && social.providers.length > 0 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                {social.providers.map((provider) => (
                  <Button
                    key={provider.alias}
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <a href={provider.loginUrl}>{provider.displayName}</a>
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardContent>

        {realm.registrationAllowed && (
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a
                href={url.registrationUrl}
                className="text-primary hover:underline font-medium"
              >
                Create one
              </a>
            </p>
          </CardFooter>
        )}
      </Card>
    </AuthLayout>
  );
}
