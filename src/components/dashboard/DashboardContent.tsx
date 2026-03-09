"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type SidebarFilter } from "./Sidebar";
import { DocumentRow } from "./DocumentRow";
import { deleteDocument } from "@/app/actions/documents";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type FilterChip = "all" | "drafts" | "has-badge" | "archived";

interface DocumentData {
  id: string;
  title: string;
  updatedAt: string | Date | null;
  wordCount: number | null;
  deletedAt: string | Date | null;
  preview?: string;
  typedPercentage?: number | null;
  badgeCount: number;
  latestBadgeVerificationId?: string | null;
}

interface DashboardContentProps {
  documents: DocumentData[];
  referenceNowMs: number;
  createAction: () => Promise<{ id: string }>;
}

export function DashboardContent({
  documents,
  referenceNowMs,
  createAction,
}: DashboardContentProps) {
  const [isClientReady, setIsClientReady] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [chipFilter, setChipFilter] = useState<FilterChip>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument(id);
    router.refresh();
  }, [router]);

  const handleCreate = useCallback(async () => {
    try {
      setIsCreating(true);
      const document = await createAction();
      router.push(`/editor/${document.id}`);
    } finally {
      setIsCreating(false);
    }
  }, [createAction, router]);

  const sevenDaysAgo = referenceNowMs - 7 * 24 * 60 * 60 * 1000;

  const filteredDocs = documents.filter((doc) => {
    // Sidebar filter
    if (sidebarFilter === "trash") return doc.deletedAt != null;
    if (doc.deletedAt != null) return false;

    if (sidebarFilter === "archive") return false; // No archive feature yet, show none
    if (sidebarFilter === "recent") {
      return doc.updatedAt && new Date(doc.updatedAt).getTime() > sevenDaysAgo;
    }

    // Chip filter
    if (chipFilter === "drafts") return doc.badgeCount === 0;
    if (chipFilter === "has-badge") return doc.badgeCount > 0;
    if (chipFilter === "archived") return false;

    return true;
  }).filter((doc) => {
    if (!searchQuery.trim()) return true;
    return doc.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const chips: { id: FilterChip; label: string }[] = [
    { id: "all", label: "All" },
    { id: "drafts", label: "Drafts" },
    { id: "has-badge", label: "Has Badge" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <Sidebar
        activeFilter={sidebarFilter}
        onFilterChange={(f) => {
          setSidebarFilter(f);
          setChipFilter("all");
        }}
        onSettingsClick={() => router.push("/settings")}
      />

      <main
        className="flex-1 overflow-auto p-6"
        data-testid="dashboard-content"
        data-ready={isClientReady ? "true" : "false"}
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <Button
            variant="provenance"
            type="button"
            onClick={handleCreate}
            disabled={!isClientReady || isCreating}
            data-testid="new-document"
          >
            {isCreating ? "Creating..." : "New Document"}
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-border py-2 pl-10 pr-4 text-sm outline-none focus:border-provenance-500 focus:ring-2 focus:ring-provenance-500/20"
          />
        </div>

        {/* Filter chips */}
        {sidebarFilter !== "trash" && (
          <div className="mb-4 flex gap-2">
            {chips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setChipFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  chipFilter === chip.id
                    ? "bg-provenance-50 text-provenance-700"
                    : "bg-secondary text-muted-foreground hover:bg-accent"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Document list */}
        {filteredDocs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No documents found.
          </p>
        ) : (
          <div className="rounded-lg border border-border">
            {filteredDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                id={doc.id}
                title={doc.title}
                updatedAt={doc.updatedAt}
                wordCount={doc.wordCount}
                preview={doc.preview}
                typedPercentage={doc.typedPercentage}
                hasBadge={doc.badgeCount > 0}
                latestBadgeVerificationId={doc.latestBadgeVerificationId}
                onClick={() => router.push(`/editor/${doc.id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
