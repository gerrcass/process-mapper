"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { GitBranch, Monitor, Play, Square, UserRound, Workflow } from "lucide-react";
import { cn } from "@/lib/cn";
import { NODE_KIND_LABELS, type FlowNode } from "@/domain/types";

export interface AtlasNodeData extends Record<string, unknown> {
  node: FlowNode;
  stepIndex: number;
}

export type AtlasNode = Node<AtlasNodeData>;

const HANDLE_CLASS =
  "!h-2.5 !w-2.5 !border-2 !border-surface !bg-ink-soft hover:!bg-accent";

function KindIcon({ kind }: { kind: FlowNode["kind"] }) {
  if (kind === "start") return <Play className="h-3 w-3" aria-hidden="true" />;
  if (kind === "end") return <Square className="h-3 w-3" aria-hidden="true" />;
  if (kind === "decision") return <GitBranch className="h-3 w-3" aria-hidden="true" />;
  return <Workflow className="h-3 w-3" aria-hidden="true" />;
}

export function AtlasNodeCard({ data, selected, type }: NodeProps<AtlasNode>) {
  const node = data.node;
  const kind = (type ?? node.kind) as FlowNode["kind"];

  if (kind === "start" || kind === "end") {
    return (
      <div
        className={cn(
          "flow-node-card flex min-w-[168px] items-center gap-2.5 rounded-full border border-ink bg-ink px-4 py-2.5 text-paper shadow-[0_8px_20px_-12px_rgba(25,24,19,.5)]",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-paper",
        )}
      >
        {kind === "end" ? (
          <Handle type="target" position={Position.Left} id="in" className={cn(HANDLE_CLASS, "!border-ink !bg-paper")} />
        ) : null}
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-paper/30 text-paper/80">
          <KindIcon kind={kind} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-paper/60">
            {NODE_KIND_LABELS[kind]}
          </p>
          <p className="truncate text-[12.5px] font-medium leading-4">{node.title}</p>
        </div>
        {kind === "start" ? (
          <Handle type="source" position={Position.Right} id="out" className={cn(HANDLE_CLASS, "!border-ink !bg-paper")} />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flow-node-card relative w-[228px] overflow-hidden rounded-card border border-line bg-surface shadow-[0_1px_2px_rgba(25,24,19,.05),0_12px_28px_-20px_rgba(25,24,19,.35)]",
        selected && "border-ink",
      )}
    >
      <span
        className={cn(
          "absolute bottom-0 left-0 top-0 w-[3px]",
          kind === "decision" ? "bg-warning" : "bg-accent",
        )}
        aria-hidden="true"
      />
      <Handle type="target" position={Position.Left} id="in" className={HANDLE_CLASS} />
      <div className="py-2.5 pl-3.5 pr-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em]",
              kind === "decision" ? "text-warning" : "text-process-text",
            )}
          >
            <KindIcon kind={kind} />
            {kind === "decision" ? "Decision" : `Step ${String(data.stepIndex).padStart(2, "0")}`}
          </span>
          {node.duration ? (
            <span className="font-mono text-[8.5px] tracking-[0.04em] text-muted">{node.duration}</span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[13px] font-semibold leading-[1.3] text-ink">{node.title}</p>
        {node.description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{node.description}</p>
        ) : null}
        {node.owner || node.system ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {node.owner ? (
              <span className="inline-flex max-w-full items-center gap-1 truncate rounded-[5px] border border-line bg-paper-raised px-1.5 py-0.5 text-[10px] leading-4 text-ink-soft">
                <UserRound className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{node.owner}</span>
              </span>
            ) : null}
            {node.system ? (
              <span className="inline-flex max-w-full items-center gap-1 truncate rounded-[5px] border border-line bg-paper-raised px-1.5 py-0.5 text-[10px] leading-4 text-ink-soft">
                <Monitor className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{node.system}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} id="out" className={HANDLE_CLASS} />
    </div>
  );
}
