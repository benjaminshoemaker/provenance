import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AISettings } from "@/components/settings/AISettings";
import { getUserPreferences } from "@/app/actions/user";
import { BackLink } from "@/components/ui/BackLink";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const prefs = await getUserPreferences();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-4" aria-label="Settings navigation">
        <BackLink href="/dashboard" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </nav>

      <div className="rounded-lg border p-6">
        <AISettings
          currentProvider={prefs.aiProvider ?? "anthropic"}
          currentModel={prefs.aiModel}
        />
      </div>
    </main>
  );
}
