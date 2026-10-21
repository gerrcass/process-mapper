"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Info, Plus } from "lucide-react";
import { toast } from "sonner";
import type { EntryLane, FlowNode, SipocEntry, SipocLane } from "@/domain/types";
import { LANE_META } from "@/domain/types";
import { useWorkspace } from "@/store/workspace";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { EntryCard } from "./entry-card";
import { StepCard } from "./step-card";
import { SortableRow, type SortableHandleProps } from "./sortable-row";
import { LANE_STYLES } from "./lane-styles";

const EXAMPLES: Record<EntryLane, Array<{ label: string; detail: string }>> = {
  suppliers: [
    { label: "Support inbox", detail: "Shared queue with a rota" },
    { label: "On-call engineer", detail: "Weekly handover" },
  ],
  inputs: [
    { label: "Signed request", detail: "Scope and accountable owner" },
    { label: "Budget line", detail: "Cost centre and approval limit" },
  ],
  outputs: [
    { label: "Decision record", detail: "Linked from the request" },
    { label: "Customer update", detail: "Plain language and dated" },
  ],
  customers: [
    { label: "Requesting team", detail: "Internal customer" },
    { label: "Account team", detail: "External relationship" },
  ],
};

function NewEntryComposer({ mapId, lane }: { mapId: string; lane: EntryLane }) {
  const addEntry = useWorkspace((state) => state.addEntry);
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const labelRef = React.useRef<HTMLInputElement>(null);
  const name = LANE_META[lane].name;

  React.useEffect(() => {
    if (open) labelRef.current?.focus();
  }, [open]);

  const submit = () => {
    if (!label.trim()) {
      setError("A label is required.");
      labelRef.current?.focus();
      return;
    }
    addEntry(mapId, lane, { label, detail });
    setLabel("");
    setDetail("");
    setError(null);
    labelRef.current?.focus();
  };

  const close = () => {
    setOpen(false);
    setLabel("");
    setDetail("");
    setError(null);
    window.setTimeout(() => document.getElementById(`add-${lane}`)?.focus(), 0);
  };

  if (!open) {
    return (
      <button
        type="button"
        id={`add-${lane}`}
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex w-full items-center gap-1.5 rounded-[8px] border border-dashed border-line-strong bg-surface/40 px-2.5 py-2 text-left text-[12px] font-medium text-ink-soft transition-colors hover:border-ink-soft hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add {name.slice(0, -1).toLowerCase()}
      </button>
    );
  }

  return (
    <form
      className="mt-2 rounded-[9px] border border-line-strong bg-surface p-2 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
    >
      <label className="sr-only" htmlFor={`new-${lane}-label`}>
        New {name.slice(0, -1).toLowerCase()} label
      </label>
      <input
        ref={labelRef}
        id={`new-${lane}-label`}
        value={label}
        onChange={(event) => {
          setLabel(event.target.value);
          setError(null);
        }}
        placeholder="Label"
        aria-invalid={Boolean(error)}
        className="h-8 w-full rounded-[5px] border border-line bg-paper-raised px-2 text-[12.5px] text-ink focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      />
      <div className="mt-1">
        <label className="sr-only" htmlFor={`new-${lane}-detail`}>
          New {name.slice(0, -1).toLowerCase()} detail
        </label>
        <input
          id={`new-${lane}-detail`}
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="Detail (optional)"
          className="h-8 w-full rounded-[5px] border border-transparent bg-transparent px-2 text-[12px] text-ink-soft hover:border-line focus-visible:border-line focus-visible:bg-paper-raised focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-1 px-1 text-[11px] text-accent-strong">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={close}
          className="rounded-[5px] px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-paper-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          aria-label={`Add ${name.slice(0, -1).toLowerCase()}`}
          className="rounded-[5px] bg-ink px-2.5 py-1 text-[11.5px] font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function NewStepComposer({ mapId }: { mapId: string }) {
  const addNode = useWorkspace((state) => state.addNode);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  const submit = () => {
    if (!title.trim()) {
      setError("A step title is required.");
      titleRef.current?.focus();
      return;
    }
    addNode(mapId, { kind: "step", title });
    setTitle("");
    setError(null);
    titleRef.current?.focus();
  };

  const close = () => {
    setOpen(false);
    setTitle("");
    setError(null);
    window.setTimeout(() => document.getElementById("add-process")?.focus(), 0);
  };

  if (!open) {
    return (
      <button
        type="button"
        id="add-process"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex w-full items-center gap-1.5 rounded-[8px] border border-dashed border-process-line bg-surface/50 px-2.5 py-2 text-left text-[12px] font-medium text-process-text transition-colors hover:border-process-text hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add step
      </button>
    );
  }

  return (
    <form
      className="mt-2 rounded-[9px] border border-process-line bg-surface p-2 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
    >
      <label className="sr-only" htmlFor="new-step-title">
        New step title
      </label>
      <input
        ref={titleRef}
        id="new-step-title"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setError(null);
        }}
        placeholder="Step title"
        aria-invalid={Boolean(error)}
        className="h-8 w-full rounded-[5px] border border-line bg-paper-raised px-2 text-[12.5px] text-ink focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      />
      {error ? (
        <p role="alert" className="mt-1 px-1 text-[11px] text-accent-strong">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={close}
          className="rounded-[5px] px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-paper-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          aria-label="Add process step"
          className="rounded-[5px] bg-ink px-2.5 py-1 text-[11.5px] font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function withArrowReordering(
  handleProps: SortableHandleProps["handleProps"],
  options: {
    index: number;
    length: number;
    isDragging: boolean;
    move: (from: number, to: number) => void;
  },
) {
  return {
    ...handleProps,
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      handleProps.onKeyDown?.(event);
      if (options.isDragging || event.defaultPrevented) return;
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      const target = event.key === "ArrowUp" ? options.index - 1 : options.index + 1;
      if (target < 0 || target >= options.length) return;
      options.move(options.index, target);
    },
  };
}

export function Lane({
  mapId,
  lane,
  entries = [],
  steps = [],
  readOnly = false,
  onOpenFlow,
  laneRef,
}: {
  mapId: string;
  lane: SipocLane;
  entries?: SipocEntry[];
  steps?: FlowNode[];
  readOnly?: boolean;
  onOpenFlow: (nodeId: string) => void;
  laneRef?: React.Ref<HTMLElement>;
}) {
  const meta = LANE_META[lane];
  const style = LANE_STYLES[lane];
  const editEntry = useWorkspace((state) => state.editEntry);
  const deleteEntry = useWorkspace((state) => state.deleteEntry);
  const reorderEntry = useWorkspace((state) => state.reorderEntry);
  const editNode = useWorkspace((state) => state.editNode);
  const deleteNode = useWorkspace((state) => state.deleteNode);
  const reorderStep = useWorkspace((state) => state.reorderStep);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isProcess = lane === "process";
  const items: Array<{ id: string }> = isProcess ? steps : entries;
  const count = items.length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    if (isProcess) reorderStep(mapId, from, to);
    else reorderEntry(mapId, lane, from, to);
  };

  return (
    <section
      ref={laneRef}
      id={`lane-${lane}`}
      tabIndex={-1}
      aria-labelledby={`lane-${lane}-title`}
      className={cn(
        "sipoc-lane flex min-h-[340px] flex-col rounded-card border focus:outline-2 focus:outline-offset-2 focus:outline-accent",
        style.tint,
        style.line,
      )}
      data-lane={lane}
    >
      <header className={cn("border-b px-3 py-2.5", style.line)}>
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-[10px] tracking-[0.1em]", style.text)}>
            {meta.number}
          </span>
          <h2 id={`lane-${lane}-title`} className="text-[12.5px] font-semibold text-ink">
            {meta.name}
          </h2>
          <span
            className={cn(
              "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 font-mono text-[10px]",
              style.chip,
            )}
            aria-label={`${count} ${isProcess ? (count === 1 ? "step" : "steps") : count === 1 ? "entry" : "entries"}`}
          >
            {count}
          </span>
          <Tooltip label={meta.help}>
            <button
              type="button"
              aria-label={`What belongs in ${meta.name}`}
              className={cn(
                "no-print inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                style.text,
              )}
            >
              <Info className="h-3 w-3" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="flex flex-1 flex-col p-2">
        {count === 0 && !isProcess && !readOnly ? (
          <div className="rounded-[8px] border border-dashed border-line-strong/70 bg-surface/35 p-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">Examples</p>
            <ul className="mt-1.5 space-y-1.5">
              {EXAMPLES[lane as EntryLane].map((example) => (
                <li key={example.label} className="border-l border-line-strong pl-2">
                  <p className="text-[11.5px] font-medium leading-4 text-ink-soft">
                    {example.label}
                  </p>
                  <p className="text-[10.5px] leading-4 text-muted">{example.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1.5">
              {isProcess
                ? steps.map((step, index) => (
                    <SortableRow key={step.id} id={step.id}>
                      {({ handleProps, isDragging }) => (
                        <StepCard
                          step={step}
                          index={index}
                          readOnly={readOnly}
                          handleProps={withArrowReordering(handleProps, {
                            index,
                            length: items.length,
                            isDragging,
                            move: (from, to) => reorderStep(mapId, from, to),
                          })}
                          onOpenFlow={() => onOpenFlow(step.id)}
                          onCommit={(field, value) => editNode(mapId, step.id, { [field]: value })}
                          onRejectTitle={() => toast("A step title cannot be empty.")}
                          onDelete={() => {
                            deleteNode(mapId, step.id);
                            toast("Step removed from the flow and SIPOC.");
                            window.setTimeout(
                              () => document.getElementById("add-process")?.focus(),
                              0,
                            );
                          }}
                        />
                      )}
                    </SortableRow>
                  ))
                : entries.map((entry, index) => (
                    <SortableRow key={entry.id} id={entry.id}>
                      {({ handleProps, isDragging }) => (
                        <EntryCard
                          entry={entry}
                          index={index}
                          laneName={meta.name}
                          laneStyle={style}
                          readOnly={readOnly}
                          handleProps={withArrowReordering(handleProps, {
                            index,
                            length: items.length,
                            isDragging,
                            move: (from, to) => reorderEntry(mapId, lane as EntryLane, from, to),
                          })}
                          onCommitLabel={(value) =>
                            editEntry(mapId, lane as EntryLane, entry.id, { label: value })
                          }
                          onCommitDetail={(value) =>
                            editEntry(mapId, lane as EntryLane, entry.id, { detail: value })
                          }
                          onRejectLabel={() => toast("An entry label cannot be empty.")}
                          onDelete={() => {
                            deleteEntry(mapId, lane as EntryLane, entry.id);
                            toast("Entry removed.");
                            window.setTimeout(
                              () => document.getElementById(`add-${lane}`)?.focus(),
                              0,
                            );
                          }}
                        />
                      )}
                    </SortableRow>
                  ))}
            </div>
          </SortableContext>
        </DndContext>

        {!readOnly ? (
          <div className="no-print mt-auto pt-2">
            {isProcess ? (
              <NewStepComposer mapId={mapId} />
            ) : (
              <NewEntryComposer mapId={mapId} lane={lane as EntryLane} />
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
