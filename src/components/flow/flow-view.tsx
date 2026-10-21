"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { NODE_KIND_LABELS, type ProcessMap } from "@/domain/types";
import { useWorkspace } from "@/store/workspace";

function FlowLoading() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper" aria-busy="true">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: "radial-gradient(rgba(25,24,19,0.08) 0.6px, transparent 0.6px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6">
        <div className="skeleton h-10 w-28 rounded-full" />
        <div className="skeleton h-24 w-56 rounded-card" />
        <div className="skeleton h-10 w-28 rounded-full" />
      </div>
      <span className="sr-only">Loading flow canvas</span>
    </div>
  );
}

const FlowCanvas = dynamic(
  () => import("./flow-canvas").then((module) => module.FlowCanvas),
  { ssr: false, loading: () => <FlowLoading /> },
);

export function FlowView({
  map,
  focusNodeId,
}: {
  map: ProcessMap;
  focusNodeId: string | null;
}) {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    focusNodeId && map.nodes.some((node) => node.id === focusNodeId) ? focusNodeId : null,
  );
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  const deleteNode = useWorkspace((state) => state.deleteNode);
  const deleteEdge = useWorkspace((state) => state.deleteEdge);

  const selectNode = React.useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) setSelectedEdgeId(null);
  }, []);

  const selectEdge = React.useCallback((id: string | null) => {
    setSelectedEdgeId(id);
    if (id) setSelectedNodeId(null);
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const selectedNode = map.nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = map.edges.find((edge) => edge.id === selectedEdgeId);
  const selectionLabel = selectedNode
    ? `${NODE_KIND_LABELS[selectedNode.kind]}: ${selectedNode.title}`
    : selectedEdge
      ? `Connection${selectedEdge.label ? `: ${selectedEdge.label}` : ""}`
      : "";

  const deleteSelection = () => {
    if (selectedNodeId) {
      deleteNode(map.id, selectedNodeId);
      setSelectedNodeId(null);
      toast(
        selectedNode?.kind === "step"
          ? "Step removed from the flow and SIPOC."
          : "Node removed from the flow.",
      );
      return;
    }
    if (selectedEdgeId) {
      deleteEdge(map.id, selectedEdgeId);
      setSelectedEdgeId(null);
      toast("Connection removed.");
    }
  };

  return (
    <div className="relative h-full w-full">
      <FlowCanvas
        map={map}
        focusNodeId={focusNodeId}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        onSelectNode={selectNode}
        onSelectEdge={selectEdge}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {selectionLabel ? `${selectionLabel} selected.` : ""}
      </p>

      {selectionLabel ? (
        <div
          role="toolbar"
          aria-label="Selection actions"
          className="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-120px)] -translate-x-1/2 items-center gap-1 rounded-full border border-ink bg-ink p-1 pl-3 text-paper shadow-[0_12px_30px_-18px_rgba(25,24,19,.7)]"
        >
          <span className="max-w-[220px] truncate text-[11.5px] font-medium">{selectionLabel}</span>
          <button
            type="button"
            onClick={deleteSelection}
            className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium text-paper/90 transition-colors hover:bg-paper/15 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Delete
          </button>
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Clear selection"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-paper/70 transition-colors hover:bg-paper/15 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
