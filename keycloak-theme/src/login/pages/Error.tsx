import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

type ErrorProps = {
  kcContext: Extract<KcContext, { pageId: "error.ftl" }>;
  i18n: I18n;
};

export default function ErrorPage({ kcContext }: ErrorProps) {
  const { message, client } = kcContext;

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-display">Something went wrong</CardTitle>
          <CardDescription>
            An error occurred during authentication
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message !== undefined && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <span dangerouslySetInnerHTML={{ __html: message.summary }} />
            </div>
          )}

          {client !== undefined && client.baseUrl !== undefined && (
            <Button variant="outline" className="w-full" asChild>
              <a href={client.baseUrl}>Return to application</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
