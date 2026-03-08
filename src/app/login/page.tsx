import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to Provenance</CardTitle>
          <CardDescription>
            Choose a provider to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              data-testid="login-google"
            >
              Continue with Google
            </Button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              data-testid="login-github"
            >
              Continue with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
