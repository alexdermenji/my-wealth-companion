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

type RegisterProps = {
  kcContext: Extract<KcContext, { pageId: "register.ftl" }>;
  i18n: I18n;
};

export default function Register({ kcContext }: RegisterProps) {
  const { url, messagesPerField, profile, message } = kcContext;
  const { attributesByName } = profile;

  return (
    <AuthLayout subtitle="Start managing your finances today">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-display">Create account</CardTitle>
          <CardDescription>
            Fill in your details to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Error message */}
          {message !== undefined && message.type === "error" && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          <form action={url.registrationAction} method="post" className="space-y-4">
            {/* First Name & Last Name */}
            {(attributesByName.firstName || attributesByName.lastName) && (
              <div className="grid grid-cols-2 gap-4">
                {attributesByName.firstName && (
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      defaultValue={attributesByName.firstName.value ?? ""}
                      required={attributesByName.firstName.required}
                      placeholder="John"
                    />
                    {messagesPerField.existsError("firstName") && (
                      <p className="text-xs text-destructive">
                        {messagesPerField.get("firstName")}
                      </p>
                    )}
                  </div>
                )}

                {attributesByName.lastName && (
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      defaultValue={attributesByName.lastName.value ?? ""}
                      required={attributesByName.lastName.required}
                      placeholder="Doe"
                    />
                    {messagesPerField.existsError("lastName") && (
                      <p className="text-xs text-destructive">
                        {messagesPerField.get("lastName")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            {attributesByName.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={attributesByName.email.value ?? ""}
                  required={attributesByName.email.required}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
                {messagesPerField.existsError("email") && (
                  <p className="text-xs text-destructive">
                    {messagesPerField.get("email")}
                  </p>
                )}
              </div>
            )}

            {/* Username */}
            {attributesByName.username && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={attributesByName.username.value ?? ""}
                  required={attributesByName.username.required}
                  autoComplete="username"
                  placeholder="Choose a username"
                />
                {messagesPerField.existsError("username") && (
                  <p className="text-xs text-destructive">
                    {messagesPerField.get("username")}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
              />
              {messagesPerField.existsError("password") && (
                <p className="text-xs text-destructive">
                  {messagesPerField.get("password")}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="password-confirm">Confirm password</Label>
              <Input
                id="password-confirm"
                name="password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
              {messagesPerField.existsError("password-confirm") && (
                <p className="text-xs text-destructive">
                  {messagesPerField.get("password-confirm")}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href={url.loginUrl}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
