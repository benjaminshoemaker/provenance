import { notFound } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseE2ELoginSearchParams, resolveE2EUserProfile } from "@/lib/auth/e2e";

interface E2ELoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function E2ELoginPage({
  searchParams,
}: E2ELoginPageProps) {
  const params = await searchParams;
  const request = parseE2ELoginSearchParams(params);

  if (!request) {
    notFound();
  }

  const userProfile = resolveE2EUserProfile(request.userKey);
  if (!userProfile) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">E2E Session Bootstrap</CardTitle>
          <CardDescription>
            Continue to create an authenticated test session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <div className="font-medium">{userProfile.name}</div>
            <div className="text-muted-foreground">{userProfile.email}</div>
          </div>
          <form
            action={async () => {
              "use server";
              await signIn("e2e", {
                userKey: request.userKey,
                token: request.token,
                redirectTo: request.callbackUrl,
              });
            }}
          >
            <Button
              type="submit"
              className="w-full"
              data-testid="e2e-login-submit"
            >
              Continue as {userProfile.name}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
