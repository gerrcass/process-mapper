"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ChevronDown,
  GitBranch,
  ListTree,
  Maximize2,
  Play,
  Plus,
  Square,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { NODE_KIND_LABELS, type FlowNodeKind, type ProcessMap } from "@/domain/types";
import { processSteps, validateEdge } from "@/domain/operations";
import { useWorkspace } from "@/store/workspace";
import { useMediaQuery } from "@/lib/use-media-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import {
  FLOW_PNG_EXPORT_EVENT,
  FLOW_PNG_PENDING_KEY,
  exportFlowPng,
} from "@/lib/export-flow-image";
import { AtlasNodeCard, type AtlasNode, type AtlasNodeData } from "./flow-nodes";
import { AtlasFlowEdge, type AtlasEdge, type AtlasEdgeData } from "./flow-edge";

const NODE_TYPES = {
  start: AtlasNodeCard,
  step: AtlasNodeCard,
  decision: AtlasNodeCard,
  end: AtlasNodeCard,
} satisfies NodeTypes;

const EDGE_TYPES = { atlas: AtlasFlowEdge } satisfies EdgeTypes;

function toNodes(map: ProcessMap, selectedNodeId: string | null): AtlasNode[] {
  const indexes = new Map(processSteps(map).map((step, index) => [step.id, index + 1]));
  return map.nodes.map((node) => ({
    id: node.id,
    type: node.kind,
    position: { ...node.position },
    selected: node.id === selectedNodeId,
    data: { node, stepIndex: indexes.get(node.id) ?? 1 } satisfies AtlasNodeData,
    ariaLabel: `${NODE_KIND_LABELS[node.kind]} ${node.title}`,
  }));
}

function toEdges(map: ProcessMap, selectedEdgeId: string | null): AtlasEdge[] {
  return map.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: "atlas",
    selected: edge.id === selectedEdgeId,
    data: { edge } satisfies AtlasEdgeData,
    ariaLabel: edge.label ? `Flow edge ${edge.label}` : "Flow edge",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: edge.kind === "exception" ? "var(--color-warning)" : "var(--color-muted)",
    },
  }));
}

function miniMapColor(node: AtlasNode): string {
  if (node.type === "start" || node.type === "end") return "var(--color-ink)";
  if (node.type === "decision") return "var(--color-warning)";
  return "var(--color-accent)";
}

function ToolbarButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Add ${label.toLowerCase()} node`}
      className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      {icon}
      {label}
    </button>
  );
}

function FlowCanvasInner({
  map,
  focusNodeId,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
}: {
  map: ProcessMap;
  focusNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
}) {
  const [nodes, setNodes] = useNodesState<AtlasNode>(toNodes(map, selectedNodeId));
  const [edges, setEdges] = useEdgesState<AtlasEdge>(toEdges(map, selectedEdgeId));
  const { fitView, setCenter, screenToFlowPosition, getNodes } = useReactFlow<
    AtlasNode,
    AtlasEdge
  >();
  const addNode = useWorkspace((state) => state.addNode);
  const deleteNode = useWorkspace((state) => state.deleteNode);
  const deleteEdge = useWorkspace((state) => state.deleteEdge);
  const connectNodes = useWorkspace((state) => state.connectNodes);
  const beginNodeDrag = useWorkspace((state) => state.beginNodeDrag);
  const endNodeDrag = useWorkspace((state) => state.endNodeDrag);
  const tidyFlow = useWorkspace((state) => state.tidyFlow);
  const setViewport = useWorkspace((state) => state.setViewport);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const focusHandled = React.useRef<string | null>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const motionDuration = reduceMotion ? 0 : 280;

  React.useEffect(() => {
    setNodes(toNodes(map, selectedNodeId));
    // Sync only when the document's nodes or the selection change; live drags update local state.
  }, [map.nodes, map, selectedNodeId, setNodes]);

  React.useEffect(() => {
    setEdges(toEdges(map, selectedEdgeId));
  }, [map.edges, map, selectedEdgeId, setEdges]);

  React.useEffect(() => {
    if (!focusNodeId || focusHandled.current === focusNodeId) return;
    const node = map.nodes.find((candidate) => candidate.id === focusNodeId);
    if (!node) return;
    focusHandled.current = focusNodeId;
    onSelectNode(focusNodeId);
    onSelectEdge(null);
    const timer = window.setTimeout(() => {
      void setCenter(node.position.x + 114, node.position.y + 45, {
        zoom: 1,
        duration: motionDuration,
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusNodeId, map.nodes, motionDuration, onSelectEdge, onSelectNode, setCenter]);

  React.useEffect(() => {
    const handleExport = () => {
      void (async () => {
        try {
          await exportFlowPng(
            map,
            getNodes(),
            wrapperRef.current?.querySelector<HTMLElement>(".react-flow__viewport") ?? null,
          );
          toast("Flow image exported.");
        } catch (error) {
          toast(
            error instanceof Error
              ? error.message
              : "Could not export the flow image. Try again from the flow view.",
          );
        } finally {
          try {
            window.sessionStorage.removeItem(FLOW_PNG_PENDING_KEY);
          } catch {
            // Ignore storage failures.
          }
        }
      })();
    };
    window.addEventListener(FLOW_PNG_EXPORT_EVENT, handleExport);
    return () => window.removeEventListener(FLOW_PNG_EXPORT_EVENT, handleExport);
  }, [getNodes, map]);

  React.useEffect(() => {
    let pending: string | null = null;
    try {
      pending = window.sessionStorage.getItem(FLOW_PNG_PENDING_KEY);
    } catch {
      return;
    }
    if (pending !== map.id) return;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event(FLOW_PNG_EXPORT_EVENT));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [map.id]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (event.key === "Escape") {
        onSelectNode(null);
        onSelectEdge(null);
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (selectedNodeId) {
        event.preventDefault();
        deleteNode(map.id, selectedNodeId);
        onSelectNode(null);
        toast("Node removed from the flow.");
      } else if (selectedEdgeId) {
        event.preventDefault();
        deleteEdge(map.id, selectedEdgeId);
        onSelectEdge(null);
        toast("Edge removed.");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteEdge, deleteNode, map.id, onSelectEdge, onSelectNode, selectedEdgeId, selectedNodeId]);

  const selectNodeAndReveal = (nodeId: string) => {
    onSelectNode(nodeId);
    onSelectEdge(null);
    revealNode(nodeId);
  };

  const revealNode = (nodeId: string) => {
    const node = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === map.id)
      ?.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    void setCenter(node.position.x + 114, node.position.y + 45, {
      zoom: 1,
      duration: motionDuration,
    });
  };

  const add = (kind: FlowNodeKind) => {
    let position: { x: number; y: number } | undefined;
    if (kind !== "step") {
      const selected = map.nodes.find((node) => node.id === selectedNodeId);
      if (selected) {
        position = { x: selected.position.x + 280, y: selected.position.y + 150 };
      } else {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) {
          position = screenToFlowPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
      }
    }
    const id = addNode(map.id, { kind, position });
    if (!id) return;
    onSelectNode(id);
    onSelectEdge(null);
    window.setTimeout(() => revealNode(id), 80);
  };

  const handleTidy = () => {
    tidyFlow(map.id);
    toast("Flow tidied. SIPOC order is unchanged.");
    window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: motionDuration });
    }, 80);
  };

  const isValidConnection: IsValidConnection = (connection) => {
    if (!connection.source || !connection.target) return false;
    return validateEdge(map, connection.source, connection.target).ok;
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const result = connectNodes(map.id, {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
    });
    if (!result.ok) {
      toast(result.reason ?? "That edge is not valid.");
      return;
    }
    toast("Nodes connected.");
  };

  const hasSavedViewport = map.viewport.x !== 0 || map.viewport.y !== 0 || map.viewport.zoom !== 1;

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const target = event.target as HTMLElement | null;
        const nodeElement = target?.closest<HTMLElement>(".react-flow__node");
        const edgeElement = target?.closest<HTMLElement>(".react-flow__edge");
        if (nodeElement?.dataset.id) {
          event.preventDefault();
          onSelectNode(nodeElement.dataset.id);
          onSelectEdge(null);
          return;
        }
        if (edgeElement?.dataset.id) {
          event.preventDefault();
          onSelectEdge(edgeElement.dataset.id);
          onSelectNode(null);
        }
      }}
    >
      <ReactFlow<AtlasNode, AtlasEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={(changes: NodeChange<AtlasNode>[]) =>
          setNodes((current) => applyNodeChanges(changes, current))
        }
        onEdgesChange={(changes: EdgeChange<AtlasEdge>[]) =>
          setEdges((current) => applyEdgeChanges(changes, current))
        }
        onNodeClick={(_, node) => {
          onSelectNode(node.id);
          onSelectEdge(null);
        }}
        onEdgeClick={(_, edge) => {
          onSelectEdge(edge.id);
          onSelectNode(null);
        }}
        onPaneClick={() => {
          onSelectNode(null);
          onSelectEdge(null);
        }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeDragStart={() => beginNodeDrag()}
        onNodeDragStop={(_, node) => endNodeDrag(map.id, node.id, node.position)}
        onMoveEnd={(_, viewport) => setViewport(map.id, viewport)}
        defaultViewport={map.viewport}
        fitView={!hasSavedViewport && map.nodes.length > 0}
        fitViewOptions={{ padding: 0.2, minZoom: 0.55, maxZoom: 0.95 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        nodesFocusable
        edgesFocusable
        className="bg-paper"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-line)" />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bottom-4 !left-4"
          aria-label="Canvas zoom controls"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={miniMapColor}
          nodeStrokeWidth={2}
          maskColor="var(--color-paper-mask)"
          className="!bottom-4 !right-4 hidden sm:block"
          ariaLabel="Flow minimap"
        />
      </ReactFlow>

      <div
        role="toolbar"
        aria-label="Flow tools"
        className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-1 rounded-card border border-line bg-surface/95 p-1 shadow-soft backdrop-blur-[1px]"
      >
        <span className="hidden px-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted lg:inline">
          Add
        </span>
        <ToolbarButton
          label="Start"
          icon={<Play className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => add("start")}
        />
        <ToolbarButton
          label="Step"
          icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => add("step")}
        />
        <ToolbarButton
          label="Decision"
          icon={<GitBranch className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => add("decision")}
        />
        <ToolbarButton
          label="End"
          icon={<Square className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => add("end")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Select a flow node"
              className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
              Nodes
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[280px] overflow-y-auto">
            <DropdownMenuLabel>Flow nodes</DropdownMenuLabel>
            {map.nodes.length === 0 ? (
              <DropdownMenuItem disabled>No nodes yet</DropdownMenuItem>
            ) : (
              map.nodes.map((node) => (
                <DropdownMenuItem key={node.id} onSelect={() => selectNodeAndReveal(node.id)}>
                  <span className="w-[58px] shrink-0 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                    {NODE_KIND_LABELS[node.kind]}
                  </span>
                  <span className="truncate">{node.title}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <Tooltip label="Arrange the canvas by dependency">
          <button
            type="button"
            onClick={handleTidy}
            className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            Tidy flow
          </button>
        </Tooltip>
        <Tooltip label="Fit the whole flow in view">
          <button
            type="button"
            onClick={() => void fitView({ padding: 0.18, duration: reduceMotion ? 0 : 240 })}
            aria-label="Fit flow in view"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      {map.nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="pointer-events-auto w-full max-w-[420px] rounded-panel border border-line bg-paper-raised p-7 text-center shadow-soft">
            <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-card border border-line bg-surface text-muted">
              <Workflow className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="eyebrow mt-4">Empty flow</p>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-ink">
              Start with the first step.
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-5 text-muted">
              The SIPOC sheet stays in sync as you build. Nodes added here appear in the Process
              lane.
            </p>
            <Button variant="primary" className="mt-5" onClick={() => add("step")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add first step
            </Button>
          </div>
        </div>
      ) : null}

      {map.nodes.length > 0 && map.edges.length === 0 ? (
        <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[10.5px] text-muted shadow-soft md:block">
          Drag from a node handle to connect it to the next.
        </p>
      ) : null}
    </div>
  );
}

export function FlowCanvas(props: {
  map: ProcessMap;
  focusNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
