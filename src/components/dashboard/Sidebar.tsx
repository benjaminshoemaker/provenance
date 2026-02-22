"use client";

import { FileText, Clock, Archive, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarFilter = "all" | "recent" | "archive" | "trash";

const NAV_ITEMS = [
  { id: "all" as const, label: "All Documents", icon: FileText },
  { id: "recent" as const, label: "Recent", icon: Clock },
  { id: "archive" as const, label: "Archive", icon: Archive },
  { id: "trash" as const, label: "Trash", icon: Trash2 },
];

interface SidebarProps {
  activeFilter: SidebarFilter;
  onFilterChange: (filter: SidebarFilter) => void;
  onSettingsClick?: () => void;
}

export function Sidebar({ activeFilter, onFilterChange, onSettingsClick }: SidebarProps) {
  return (
    <div className="flex w-56 flex-col border-r border-gray-100 bg-gray-50/50 p-4" role="navigation" aria-label="Sidebar">
      <div className="mb-4 flex items-center gap-2 px-3">
        <span className="text-lg font-bold text-provenance-700">◆</span>
        <span className="text-sm font-semibold text-provenance-900">Provenance</span>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Document filters">
        {NAV_ITEMS.map((item) => {
          const isActive = activeFilter === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                isActive
                  ? "bg-provenance-50 font-medium text-provenance-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={onSettingsClick}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors duration-150"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
