export const SCHEMA_VERSION = 1;

export const MAP_STATUSES = ["draft", "active", "archived"] as const;
export type MapStatus = (typeof MAP_STATUSES)[number];

export const MAP_ORIGINS = ["demo", "blank", "template", "import", "duplicate"] as const;
export type MapOrigin = (typeof MAP_ORIGINS)[number];

export const ENTRY_LANES = ["suppliers", "inputs", "outputs", "customers"] as const;
export type EntryLane = (typeof ENTRY_LANES)[number];
export type SipocLane = EntryLane | "process";

export const FLOW_NODE_KINDS = ["start", "step", "decision", "end"] as const;
export type FlowNodeKind = (typeof FLOW_NODE_KINDS)[number];

export const EDGE_KINDS = ["flow", "exception"] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];

export interface SipocEntry {
  id: string;
  label: string;
  detail: string;
}

export interface FlowPosition {
  x: number;
  y: number;
}

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  title: string;
  description: string;
  owner: string;
  system: string;
  duration: string;
  position: FlowPosition;
  /** Present only on step nodes. Starts at 1 and stays contiguous within a map. */
  sipocOrder?: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label: string;
  kind: EdgeKind;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface SipocSheet {
  suppliers: SipocEntry[];
  inputs: SipocEntry[];
  outputs: SipocEntry[];
  customers: SipocEntry[];
}

export interface ProcessMap {
  schemaVersion: number;
  id: string;
  title: string;
  description: string;
  status: MapStatus;
  origin: MapOrigin;
  createdAt: string;
  updatedAt: string;
  sipoc: SipocSheet;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
}

export interface LaneMeta {
  id: SipocLane;
  number: string;
  name: string;
  shortName: string;
  help: string;
}

export const LANE_META: Record<SipocLane, LaneMeta> = {
  suppliers: {
    id: "suppliers",
    number: "01",
    name: "Suppliers",
    shortName: "Suppliers",
    help: "Teams, tools, or vendors that provide what the process needs.",
  },
  inputs: {
    id: "inputs",
    number: "02",
    name: "Inputs",
    shortName: "Inputs",
    help: "What must be true or available before the work starts.",
  },
  process: {
    id: "process",
    number: "03",
    name: "Process",
    shortName: "Process",
    help: "The steps in sequence. These are generated from the flow graph.",
  },
  outputs: {
    id: "outputs",
    number: "04",
    name: "Outputs",
    shortName: "Outputs",
    help: "What the process produces for its customers.",
  },
  customers: {
    id: "customers",
    number: "05",
    name: "Customers",
    shortName: "Customers",
    help: "Who receives or is affected by the output.",
  },
};

export const STATUS_LABELS: Record<MapStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const NODE_KIND_LABELS: Record<FlowNodeKind, string> = {
  start: "Start",
  step: "Step",
  decision: "Decision",
  end: "End",
};

export const LANE_ORDER: SipocLane[] = ["suppliers", "inputs", "process", "outputs", "customers"];

export const ENTRY_ORDER: EntryLane[] = ["suppliers", "inputs", "outputs", "customers"];
