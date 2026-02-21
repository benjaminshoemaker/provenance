import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AISettings } from "@/components/settings/AISettings";
import { getUserPreferences } from "@/app/actions/user";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const prefs = await getUserPreferences();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Documents
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="rounded-lg border p-6">
        <AISettings
          currentProvider={prefs.aiProvider ?? "anthropic"}
          currentModel={prefs.aiModel}
        />
      </div>
    </div>
  );
}
