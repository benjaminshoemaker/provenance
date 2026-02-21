"use client";

import { useState, useTransition } from "react";
import { providers } from "@/lib/ai/providers";
import { updateUserPreferences } from "@/app/actions/user";

interface AISettingsProps {
  currentProvider: string;
  currentModel: string | null;
}

export function AISettings({ currentProvider, currentModel }: AISettingsProps) {
  const [provider, setProvider] = useState(currentProvider || "anthropic");
  const [model, setModel] = useState(
    currentModel || providers[currentProvider]?.defaultModel || ""
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const selectedProvider = providers[provider];
  const availableModels = selectedProvider?.models ?? [];

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const p = providers[newProvider];
    setModel(p?.defaultModel || "");
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateUserPreferences({ aiProvider: provider, aiModel: model });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">AI Provider Settings</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">Provider</label>
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {Object.values(providers).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.tier})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving..." : saved ? "Saved" : "Save Preferences"}
      </button>
    </div>
  );
}
