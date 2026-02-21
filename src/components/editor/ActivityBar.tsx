"use client";

import { FileText, MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const PANEL_ITEMS = [
  { id: "editor", label: "Editor", icon: FileText, shortcut: "⌘⇧1" },
  { id: "ai-chat", label: "AI Chat", icon: MessageSquare, shortcut: "⌘⇧2" },
] as const;

export type PanelId = (typeof PANEL_ITEMS)[number]["id"];

interface ActivityBarProps {
  isPanelOpen: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export function ActivityBar({ isPanelOpen, onToggle }: ActivityBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Panel controls"
      aria-orientation="vertical"
      className="flex w-12 flex-col items-center gap-1 border-r bg-muted/30 py-2"
    >
      {PANEL_ITEMS.map((item) => {
        const isActive = isPanelOpen(item.id);
        const Icon = item.icon;
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                aria-pressed={isActive}
                aria-controls={`panel-${item.id}`}
                onClick={() => onToggle(item.id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {item.label} ({item.shortcut})
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
