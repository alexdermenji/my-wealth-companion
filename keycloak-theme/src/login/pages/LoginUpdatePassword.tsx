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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginUpdatePasswordProps = {
  kcContext: Extract<KcContext, { pageId: "login-update-password.ftl" }>;
  i18n: I18n;
};

export default function LoginUpdatePassword({ kcContext }: LoginUpdatePasswordProps) {
  const { url, message, isAppInitiatedAction } = kcContext;

  return (
    <AuthLayout subtitle="Secure your account">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-display">Update password</CardTitle>
          <CardDescription>
            Please set a new password for your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Warning / info message */}
          {message !== undefined && message.type === "warning" && (
            <div className="mb-4 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          {message !== undefined && message.type === "error" && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          <form action={url.loginAction} method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-new">New password</Label>
              <Input
                id="password-new"
                name="password-new"
                type="password"
                autoFocus
                autoComplete="new-password"
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirm">Confirm password</Label>
              <Input
                id="password-confirm"
                name="password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="logout-sessions"
                name="logout-sessions"
                defaultChecked
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="logout-sessions" className="text-sm font-normal cursor-pointer">
                Sign out from other devices
              </Label>
            </div>

            <Button type="submit" className="w-full">
              Update password
            </Button>

            {isAppInitiatedAction && (
              <Button
                type="submit"
                name="cancel-aia"
                value="true"
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
