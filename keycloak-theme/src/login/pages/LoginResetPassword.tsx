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
import { ArrowLeft } from "lucide-react";

type LoginResetPasswordProps = {
  kcContext: Extract<KcContext, { pageId: "login-reset-password.ftl" }>;
  i18n: I18n;
};

export default function LoginResetPassword({ kcContext }: LoginResetPasswordProps) {
  const { url, messagesPerField, message } = kcContext;

  return (
    <AuthLayout subtitle="Reset your password">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-display">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Success message */}
          {message !== undefined && message.type === "success" && (
            <div className="mb-4 rounded-md border border-success/50 bg-success/10 p-3 text-sm text-success">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          {/* Error message */}
          {message !== undefined && message.type === "error" && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          <form action={url.loginAction} method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                name="username"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
              />
              {messagesPerField.existsError("username") && (
                <p className="text-xs text-destructive">
                  {messagesPerField.get("username")}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <a
            href={url.loginUrl}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </a>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
