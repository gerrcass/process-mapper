"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUndoRedoShortcuts } from "@/lib/use-undo-redo-shortcuts";
import {
  ArrowLeft,
  Check,
  Copy,
  MoreHorizontal,
  PencilLine,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { mapStats } from "@/domain/operations";
import { STATUS_LABELS, type MapStatus } from "@/domain/types";
import { useWorkspace } from "@/store/workspace";
import { formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/cn";
import { InlineField } from "@/components/sipoc/inline-field";
import { SipocBoard } from "@/components/sipoc/sipoc-board";
import { StatusPill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapNotFound } from "@/components/map-not-found";
import { DeleteMapDialog } from "@/components/map-delete-dialog";
import { MapDetailsDialog } from "./map-dialogs";

function StatusMenu({ mapId, status }: { mapId: string; status: MapStatus }) {
  const setStatus = useWorkspace((state) => state.setStatus);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Status: ${STATUS_LABELS[status]}. Change status`}
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <StatusPill
            status={status}
            className="cursor-pointer transition-colors hover:border-line-strong"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {(Object.keys(STATUS_LABELS) as MapStatus[]).map((value) => (
          <DropdownMenuItem key={value} onSelect={() => setStatus(mapId, value)}>
            <span className="flex h-3.5 w-3.5 items-center justify-center">
              {value === status ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            </span>
            {STATUS_LABELS[value]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FlowComingSoon() {
  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="max-w-[520px] rounded-panel border border-line bg-paper-raised p-8 text-center shadow-soft">
        <div
          className="mx-auto flex max-w-[280px] items-center justify-center gap-2"
          aria-hidden="true"
        >
          <span className="h-8 rounded-full bg-ink px-3" />
          <span className="h-px flex-1 bg-line-strong" />
          <span className="h-14 w-24 rounded-card border border-line bg-surface" />
          <span className="h-px flex-1 bg-line-strong" />
          <span className="h-8 rounded-full bg-ink px-3" />
        </div>
        <p className="eyebrow mt-7">Flow view</p>
        <h2 className="mt-2 font-display text-[30px] leading-tight text-ink">
          The flow canvas is the next view.
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-ink-soft">
          The document already holds nodes and edges. The editable canvas lands here in a later
          ticket; the SIPOC sheet is the working view for now.
        </p>
        <Link
          href="?view=sipoc"
          className="mt-5 inline-flex text-[13px] font-medium text-accent-strong underline-offset-4 hover:underline"
        >
          Back to the SIPOC sheet
        </Link>
      </div>
    </div>
  );
}

export function Editor({ mapId }: { mapId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const map = useWorkspace((state) => state.maps.find((candidate) => candidate.id === mapId));
  const updateDetails = useWorkspace((state) => state.updateDetails);
  const duplicateMap = useWorkspace((state) => state.duplicateMap);
  const undo = useWorkspace((state) => state.undo);
  const redo = useWorkspace((state) => state.redo);
  const canUndo = useWorkspace((state) => state.past.length > 0);
  const canRedo = useWorkspace((state) => state.future.length > 0);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  useUndoRedoShortcuts();

  const view = searchParams.get("view") === "flow" ? "flow" : "sipoc";

  if (!map) return <MapNotFound />;

  const stats = mapStats(map);
  const sipocHref = `/maps/${map.id}`;
  const flowHref = `/maps/${map.id}?view=flow`;

  const openFlow = (nodeId: string) => {
    router.push(`/maps/${map.id}?view=flow&node=${encodeURIComponent(nodeId)}`);
  };

  const duplicate = () => {
    const copyId = duplicateMap(map.id);
    if (!copyId) return;
    toast("Map duplicated.");
    router.push(`/maps/${copyId}`);
  };

  return (
    <div className="editor-root flex h-dvh flex-col overflow-hidden bg-paper">
      <header className="editor-header z-30 shrink-0 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <Tooltip label="Back to workspace">
            <Link
              href="/"
              aria-label="Back to workspace"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:bg-paper-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Tooltip>

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <InlineField
              value={map.title}
              onCommit={(value) => updateDetails(map.id, { title: value })}
              onReject={() => toast("A map title cannot be empty.")}
              ariaLabel="Map title"
              className="w-[min(42vw,430px)] shrink-0"
              inputClassName="truncate font-display text-[24px] leading-8 tracking-[-0.01em] text-ink sm:text-[27px]"
            />
            <div className="hidden shrink-0 sm:block">
              <StatusMenu mapId={map.id} status={map.status} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden items-center gap-1 sm:flex">
              <Tooltip label="Undo">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo last change"
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Tooltip>
              <Tooltip label="Redo">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo change"
                >
                  <Redo2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Tooltip>
              <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Map actions">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
                  <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                  Map details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={duplicate}>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Duplicate map
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="danger" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete map
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav className="editor-tabs shrink-0 border-b border-line bg-paper" aria-label="Map views">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between gap-4 px-3 sm:px-5">
          <div className="flex items-center gap-1 rounded-control border border-line bg-paper-raised p-1">
            <Link
              href={sipocHref}
              aria-current={view === "sipoc" ? "page" : undefined}
              className={cn(
                "rounded-[7px] px-3 py-1 text-[12.5px] font-medium transition-colors",
                view === "sipoc"
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(25,24,19,.06)]"
                  : "text-muted hover:text-ink",
              )}
            >
              SIPOC
            </Link>
            <Link
              href={flowHref}
              aria-current={view === "flow" ? "page" : undefined}
              className={cn(
                "rounded-[7px] px-3 py-1 text-[12.5px] font-medium transition-colors",
                view === "flow"
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(25,24,19,.06)]"
                  : "text-muted hover:text-ink",
              )}
            >
              Flow
            </Link>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="hidden md:inline">
              <span className="font-medium text-ink-soft">{stats.steps}</span> steps
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="font-medium text-ink-soft">{stats.entries}</span> entries
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              Updated {formatRelativeTime(map.updatedAt)}
            </span>
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em]"
              title="Stored in this browser"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Saved locally
            </span>
          </div>
        </div>
      </nav>

      {view === "sipoc" ? (
        <main
          id="sipoc-view"
          tabIndex={-1}
          className="editor-main flex-1 overflow-y-auto focus:outline-none"
        >
          <div className="mx-auto max-w-[1240px] px-3 py-5 sm:px-6 sm:py-6">
            <SipocBoard map={map} onOpenFlow={openFlow} />
          </div>
        </main>
      ) : (
        <main className="editor-main flex-1 overflow-hidden">
          <FlowComingSoon />
        </main>
      )}

      {detailsOpen ? (
        <MapDetailsDialog map={map} open={detailsOpen} onOpenChange={setDetailsOpen} />
      ) : null}
      {deleteOpen ? (
        <DeleteMapDialog
          map={map}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => router.push("/")}
        />
      ) : null}
    </div>
  );
}
