"use client";

import { ArrowUpRight, Copy, GitBranch, Play, Square, Trash2, Workflow, X } from "lucide-react";
import { toast } from "sonner";
import { NODE_KIND_LABELS, type FlowEdge, type FlowNode, type ProcessMap } from "@/domain/types";
import { useWorkspace } from "@/store/workspace";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { InspectorField } from "./inspector-field";

function KindGlyph({ kind }: { kind: FlowNode["kind"] }) {
  if (kind === "start") return <Play className="h-3.5 w-3.5" aria-hidden="true" />;
  if (kind === "end") return <Square className="h-3.5 w-3.5" aria-hidden="true" />;
  if (kind === "decision") return <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Workflow className="h-3.5 w-3.5" aria-hidden="true" />;
}

const NODE_HELP: Record<FlowNode["kind"], string> = {
  start: "Where the process begins.",
  step: "A unit of work. Step nodes appear in the SIPOC Process lane.",
  decision: "A branch point. Label outgoing connections with the outcome.",
  end: "Where the process finishes.",
};

function NodeInspector({
  map,
  node,
  onClose,
  onSelectNode,
  onOpenSipoc,
}: {
  map: ProcessMap;
  node: FlowNode;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onOpenSipoc: () => void;
}) {
  const editNode = useWorkspace((state) => state.editNode);
  const deleteNode = useWorkspace((state) => state.deleteNode);
  const copyNode = useWorkspace((state) => state.copyNode);

  const update = (patch: Parameters<typeof editNode>[2]) => editNode(map.id, node.id, patch);

  const duplicate = () => {
    const copyId = copyNode(map.id, node.id);
    if (!copyId) return;
    onSelectNode(copyId);
    toast("Node duplicated.");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <p className="eyebrow">Node</p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-[24px] leading-none text-ink">
            <span className={cn(node.kind === "decision" ? "text-warning" : "text-process-text")}>
              <KindGlyph kind={node.kind} />
            </span>
            {NODE_KIND_LABELS[node.kind]}
          </h2>
          <p className="mt-1.5 max-w-[34ch] text-[11px] leading-4 text-muted">
            {NODE_HELP[node.kind]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <InspectorField
          label="Title"
          value={node.title}
          onCommit={(title) => update({ title })}
          required
          placeholder="What happens here"
        />
        <InspectorField
          label={node.kind === "decision" ? "Decision logic" : "Description"}
          value={node.description}
          onCommit={(description) => update({ description })}
          multiline
          rows={3}
          placeholder={
            node.kind === "decision"
              ? "What test decides the branch"
              : "What happens, and what good looks like"
          }
        />

        {node.kind === "step" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <InspectorField
                label="Owner"
                value={node.owner}
                onCommit={(owner) => update({ owner })}
                placeholder="Accountable person"
              />
              <InspectorField
                label="System"
                value={node.system}
                onCommit={(system) => update({ system })}
                placeholder="Tool of record"
              />
            </div>
            <InspectorField
              label="Duration"
              value={node.duration}
              onCommit={(duration) => update({ duration })}
              placeholder="e.g. 20 min"
              hint="Optional"
            />
            <div className="flex items-center justify-between gap-2 rounded-control border border-line bg-surface px-3 py-2.5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                  SIPOC order
                </p>
                <p className="mt-0.5 text-[12.5px] font-medium text-ink">
                  Step {String(node.sipocOrder ?? 0).padStart(2, "0")}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenSipoc}
                className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] font-medium text-accent-strong transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                View in SIPOC
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-control border border-line bg-surface px-3 py-2.5 text-[11px] leading-4 text-muted">
            Only step nodes appear in the SIPOC Process lane. This node stays in the flow.
          </p>
        )}
      </div>

      <footer className="flex items-center gap-2 border-t border-line px-4 py-3">
        <Button size="sm" onClick={duplicate} className="flex-1">
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Duplicate
        </Button>
        <Button
          size="sm"
          onClick={() => {
            deleteNode(map.id, node.id);
            onClose();
            toast(node.kind === "step" ? "Step removed from the flow and SIPOC." : "Node removed.");
          }}
          className="flex-1 border-accent/40 bg-accent-soft text-accent-strong hover:border-accent hover:bg-accent/15"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </footer>
    </div>
  );
}

function EdgeInspector({
  map,
  edge,
  onClose,
}: {
  map: ProcessMap;
  edge: FlowEdge;
  onClose: () => void;
}) {
  const editEdge = useWorkspace((state) => state.editEdge);
  const deleteEdge = useWorkspace((state) => state.deleteEdge);
  const source = map.nodes.find((node) => node.id === edge.source);
  const target = map.nodes.find((node) => node.id === edge.target);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
        <div>
          <p className="eyebrow">Connection</p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-[24px] leading-none text-ink">
            <span className={edge.kind === "exception" ? "text-warning" : "text-ink-soft"}>
              <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            Flow edge
          </h2>
          <p className="mt-1.5 max-w-[34ch] text-[11px] leading-4 text-muted">
            Label the outcome and mark exception paths so a branch reads clearly.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="rounded-control border border-line bg-surface px-3 py-2.5 text-[11.5px] leading-5 text-ink-soft">
          <p className="truncate">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              From
            </span>{" "}
            {source?.title ?? "Unknown"}
          </p>
          <p className="truncate">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">To</span>{" "}
            {target?.title ?? "Unknown"}
          </p>
        </div>

        <InspectorField
          label="Label"
          value={edge.label}
          onCommit={(label) => editEdge(map.id, edge.id, { label })}
          placeholder="Yes, No, Escalate"
          hint="Optional"
        />

        <fieldset>
          <legend className="mb-1.5 text-[11px] font-medium text-ink-soft">Kind</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["flow", "exception"] as const).map((kind) => (
              <label
                key={kind}
                className={cn(
                  "cursor-pointer rounded-control border p-2.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
                  edge.kind === kind
                    ? "border-ink bg-surface"
                    : "border-line bg-surface/60 hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="edge-kind"
                  value={kind}
                  checked={edge.kind === kind}
                  onChange={() => editEdge(map.id, edge.id, { kind })}
                  className="sr-only"
                />
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      kind === "exception" ? "bg-warning" : "bg-ink-soft",
                    )}
                    aria-hidden="true"
                  />
                  {kind === "flow" ? "Flow" : "Exception"}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-muted">
                  {kind === "flow" ? "Normal hand-off." : "Loop or alternate path."}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <footer className="border-t border-line px-4 py-3">
        <Button
          size="sm"
          onClick={() => {
            deleteEdge(map.id, edge.id);
            onClose();
            toast("Connection removed.");
          }}
          className="w-full border-accent/40 bg-accent-soft text-accent-strong hover:border-accent hover:bg-accent/15"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete connection
        </Button>
      </footer>
    </div>
  );
}

export function Inspector({
  map,
  node,
  edge,
  onClose,
  onSelectNode,
  onOpenSipoc,
}: {
  map: ProcessMap;
  node?: FlowNode;
  edge?: FlowEdge;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onOpenSipoc: () => void;
}) {
  if (node) {
    return (
      <NodeInspector
        map={map}
        node={node}
        onClose={onClose}
        onSelectNode={onSelectNode}
        onOpenSipoc={onOpenSipoc}
      />
    );
  }
  if (edge) {
    return <EdgeInspector map={map} edge={edge} onClose={onClose} />;
  }
  return null;
}
