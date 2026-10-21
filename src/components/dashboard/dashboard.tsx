"use client";

import * as React from "react";
import { FolderOpen, Plus, Redo2, RotateCcw, Search, SearchX, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/store/workspace";
import { useUndoRedoShortcuts } from "@/lib/use-undo-redo-shortcuts";
import { Button } from "@/components/ui/button";
import { ImportMapControl } from "@/components/import-map-control";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteMapDialog } from "@/components/map-delete-dialog";
import type { ProcessMap } from "@/domain/types";
import { MapCard } from "./map-card";
import { NewMapDialog } from "./new-map-dialog";
import { ResetDemoDialog } from "./reset-demo-dialog";
import { TemplateGallery } from "./template-gallery";

export function Dashboard() {
  const maps = useWorkspace((state) => state.maps);
  const duplicateMap = useWorkspace((state) => state.duplicateMap);
  const undo = useWorkspace((state) => state.undo);
  const redo = useWorkspace((state) => state.redo);
  const canUndo = useWorkspace((state) => state.past.length > 0);
  const canRedo = useWorkspace((state) => state.future.length > 0);
  const [query, setQuery] = React.useState("");
  const [newMapOpen, setNewMapOpen] = React.useState(false);
  const [newMapTemplate, setNewMapTemplate] = React.useState<string | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ProcessMap | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  useUndoRedoShortcuts();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sorted = React.useMemo(
    () =>
      [...maps].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [maps],
  );

  const normalized = query.trim().toLowerCase();
  const filtered = React.useMemo(
    () =>
      normalized
        ? sorted.filter((map) =>
            `${map.title} ${map.description}`.toLowerCase().includes(normalized),
          )
        : sorted,
    [normalized, sorted],
  );

  const duplicate = (id: string) => {
    const copyId = duplicateMap(id);
    if (!copyId) return;
    setQuery("");
    toast("Map duplicated.");
  };

  const openNewMap = (templateId: string | null = null) => {
    setNewMapTemplate(templateId);
    setNewMapOpen(true);
  };

  return (
    <main className="mx-auto max-w-[1180px] px-6 pb-20 pt-10 sm:pt-14">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Workspace</p>
        <h1 className="max-w-[720px] font-display text-[52px] leading-[0.98] tracking-[-0.02em] text-ink sm:text-[64px]">
          Frame the process.
          <br />
          Map the flow.
        </h1>
        <p className="max-w-[620px] text-[14px] leading-6 text-ink-soft">
          One workspace for the SIPOC summary and the flow behind it. Everything stays in this
          browser.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-b border-line pb-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[26px] leading-none text-ink">Process maps</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              {normalized
                ? `${filtered.length} of ${sorted.length}`
                : `${sorted.length} ${sorted.length === 1 ? "map" : "maps"}`}
            </span>
            <div className="ml-1 flex items-center gap-0.5">
              <Tooltip label="Undo">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo last change"
                  className="h-7 w-7"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Tooltip>
              <Tooltip label="Redo">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo change"
                  className="h-7 w-7"
                >
                  <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search maps"
                placeholder="Search maps"
                className="h-9 w-[190px] rounded-control border border-line bg-surface pl-8 pr-8 text-[12.5px] text-ink transition-colors hover:border-line-strong focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search field"
                  className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-paper-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <ImportMapControl onImported={() => setQuery("")} />
            <Button onClick={() => setResetOpen(true)} aria-label="Reset demo workspace">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Reset demo</span>
            </Button>
            <Button variant="primary" onClick={() => openNewMap()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New map
            </Button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line-strong bg-paper-raised p-10 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-line-strong" aria-hidden="true" />
          <h3 className="mt-3 font-display text-[26px] text-ink">This workspace is empty</h3>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-5 text-muted">
            Create a map from a template or restore the two seeded maps to get the demo back.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => setResetOpen(true)}>Restore demo maps</Button>
            <Button variant="primary" onClick={() => openNewMap()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create a map
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line-strong bg-paper-raised p-10 text-center">
          <SearchX className="mx-auto h-8 w-8 text-line-strong" aria-hidden="true" />
          <h3 className="mt-3 font-display text-[26px] text-ink">No maps match “{query.trim()}”</h3>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-5 text-muted">
            Search checks map titles and descriptions. Clear the search to see all {sorted.length}{" "}
            maps.
          </p>
          <Button className="mt-5" onClick={() => setQuery("")}>
            Show all maps
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {filtered.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              onDuplicate={duplicate}
              onDelete={(target) => setDeleteTarget(target)}
            />
          ))}
        </div>
      )}

      <TemplateGallery onUseTemplate={(templateId) => openNewMap(templateId)} />

      <p className="mt-10 max-w-[64ch] text-[11.5px] leading-5 text-muted">
        Seeded maps are local demo content. Edits autosave to this browser and can be exported as
        JSON from any map. Press{" "}
        <kbd className="rounded border border-line bg-surface px-1 font-mono">/</kbd> to search.
      </p>

      {newMapOpen ? (
        <NewMapDialog
          key={newMapTemplate ?? "blank"}
          open={newMapOpen}
          onOpenChange={setNewMapOpen}
          initialTemplateId={newMapTemplate === "blank" ? null : newMapTemplate}
        />
      ) : null}
      {resetOpen ? <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} /> : null}
      {deleteTarget ? (
        <DeleteMapDialog
          map={deleteTarget}
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={() => setDeleteTarget(null)}
        />
      ) : null}
    </main>
  );
}
