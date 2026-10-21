import {
  ENTRY_LANES,
  LANE_ORDER,
  NODE_KIND_LABELS,
  SCHEMA_VERSION,
  type EdgeKind,
  type EntryLane,
  type FlowEdge,
  type FlowNode,
  type FlowNodeKind,
  type FlowPosition,
  type MapStatus,
  type ProcessMap,
  type SipocEntry,
  type Viewport,
} from "./types";

export type MapOperationErrorCode =
  | "empty-label"
  | "empty-title"
  | "unknown-node"
  | "unknown-edge"
  | "self-loop"
  | "duplicate-edge"
  | "invalid-order"
  | "empty-step";

export class MapOperationError extends Error {
  constructor(
    public readonly code: MapOperationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MapOperationError";
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const STEP_GAP_X = 320;
const STEP_DEFAULT_Y = 180;
const OTHER_DEFAULT_POSITION: FlowPosition = { x: 140, y: 420 };

function touch(map: ProcessMap, now: string): ProcessMap {
  return { ...map, updatedAt: now };
}

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new MapOperationError("empty-title", "A map title is required.");
  }
  return trimmed;
}

function requireLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new MapOperationError("empty-label", "An entry label is required.");
  }
  return trimmed;
}

function optionalText(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function processSteps(map: ProcessMap): FlowNode[] {
  return map.nodes
    .filter((node) => node.kind === "step")
    .sort((a, b) => (a.sipocOrder ?? 0) - (b.sipocOrder ?? 0));
}

export function highestOrderStep(map: ProcessMap): FlowNode | undefined {
  return processSteps(map).at(-1);
}

export function nodeById(map: ProcessMap, id: string): FlowNode | undefined {
  return map.nodes.find((node) => node.id === id);
}

export function edgeById(map: ProcessMap, id: string): FlowEdge | undefined {
  return map.edges.find((edge) => edge.id === id);
}

export function laneEntries(map: ProcessMap, lane: EntryLane): SipocEntry[] {
  return map.sipoc[lane];
}

export interface MapStats {
  suppliers: number;
  inputs: number;
  outputs: number;
  customers: number;
  entries: number;
  steps: number;
}

export function mapStats(map: ProcessMap): MapStats {
  const suppliers = map.sipoc.suppliers.length;
  const inputs = map.sipoc.inputs.length;
  const outputs = map.sipoc.outputs.length;
  const customers = map.sipoc.customers.length;
  return {
    suppliers,
    inputs,
    outputs,
    customers,
    entries: suppliers + inputs + outputs + customers,
    steps: processSteps(map).length,
  };
}

export function createBlankMap(options: {
  id: string;
  title: string;
  description?: string;
  now: string;
}): ProcessMap {
  const title = requireTitle(options.title);
  return {
    schemaVersion: SCHEMA_VERSION,
    id: options.id,
    title,
    description: options.description?.trim() ?? "",
    status: "draft",
    origin: "blank",
    createdAt: options.now,
    updatedAt: options.now,
    sipoc: { suppliers: [], inputs: [], outputs: [], customers: [] },
    nodes: [],
    edges: [],
    viewport: { ...DEFAULT_VIEWPORT },
  };
}

export interface MapDetailsPatch {
  title?: string;
  description?: string;
  status?: MapStatus;
}

export function updateMapDetails(map: ProcessMap, patch: MapDetailsPatch, now: string): ProcessMap {
  return touch(
    {
      ...map,
      title: patch.title === undefined ? map.title : requireTitle(patch.title),
      description: patch.description === undefined ? map.description : patch.description.trim(),
      status: patch.status ?? map.status,
    },
    now,
  );
}

export function addEntry(
  map: ProcessMap,
  lane: EntryLane,
  input: { label: string; detail?: string },
  now: string,
): ProcessMap {
  const entry: SipocEntry = {
    id: createId("entry"),
    label: requireLabel(input.label),
    detail: optionalText(input.detail),
  };
  return touch(
    {
      ...map,
      sipoc: { ...map.sipoc, [lane]: [...map.sipoc[lane], entry] },
    },
    now,
  );
}

export function updateEntry(
  map: ProcessMap,
  lane: EntryLane,
  entryId: string,
  patch: { label?: string; detail?: string },
  now: string,
): ProcessMap {
  return touch(
    {
      ...map,
      sipoc: {
        ...map.sipoc,
        [lane]: map.sipoc[lane].map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                label: patch.label === undefined ? entry.label : requireLabel(patch.label),
                detail: patch.detail === undefined ? entry.detail : patch.detail.trim(),
              }
            : entry,
        ),
      },
    },
    now,
  );
}

export function removeEntry(
  map: ProcessMap,
  lane: EntryLane,
  entryId: string,
  now: string,
): ProcessMap {
  return touch(
    {
      ...map,
      sipoc: { ...map.sipoc, [lane]: map.sipoc[lane].filter((entry) => entry.id !== entryId) },
    },
    now,
  );
}

export function reorderEntries(
  map: ProcessMap,
  lane: EntryLane,
  fromIndex: number,
  toIndex: number,
  now: string,
): ProcessMap {
  const entries = map.sipoc[lane];
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= entries.length ||
    toIndex >= entries.length ||
    fromIndex === toIndex
  ) {
    if (fromIndex === toIndex) return map;
    throw new MapOperationError("invalid-order", "That position is outside the lane.");
  }
  const next = [...entries];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return touch({ ...map, sipoc: { ...map.sipoc, [lane]: next } }, now);
}

function nextStepOrder(map: ProcessMap): number {
  return (
    processSteps(map).reduce((highest, step) => Math.max(highest, step.sipocOrder ?? 0), 0) + 1
  );
}

function defaultStepPosition(map: ProcessMap): FlowPosition {
  if (map.nodes.length === 0) return { x: 120, y: STEP_DEFAULT_Y };
  const rightmost = map.nodes.reduce((max, node) => Math.max(max, node.position.x), 0);
  const lastStep = highestOrderStep(map);
  return {
    x: rightmost + STEP_GAP_X,
    y: lastStep?.position.y ?? STEP_DEFAULT_Y,
  };
}

export interface AddNodeInput {
  kind: FlowNodeKind;
  title?: string;
  description?: string;
  owner?: string;
  system?: string;
  duration?: string;
  position?: FlowPosition;
}

export function addNode(map: ProcessMap, input: AddNodeInput, now: string): ProcessMap {
  const title = input.title?.trim() || `New ${NODE_KIND_LABELS[input.kind].toLowerCase()}`;
  const isStep = input.kind === "step";
  const node: FlowNode = {
    id: createId("node"),
    kind: input.kind,
    title,
    description: optionalText(input.description),
    owner: optionalText(input.owner),
    system: optionalText(input.system),
    duration: optionalText(input.duration),
    position: isStep
      ? (input.position ?? defaultStepPosition(map))
      : (input.position ?? OTHER_DEFAULT_POSITION),
    ...(isStep ? { sipocOrder: nextStepOrder(map) } : {}),
  };

  let next: ProcessMap = { ...map, nodes: [...map.nodes, node] };
  if (isStep) {
    const previous = highestOrderStep(map);
    if (previous) {
      next = {
        ...next,
        edges: [
          ...next.edges,
          {
            id: createId("edge"),
            source: previous.id,
            target: node.id,
            label: "",
            kind: "flow",
          },
        ],
      };
    }
  }
  return touch(next, now);
}

export type FlowNodePatch = Partial<
  Pick<FlowNode, "title" | "description" | "owner" | "system" | "duration">
>;

export function updateNode(
  map: ProcessMap,
  nodeId: string,
  patch: FlowNodePatch,
  now: string,
): ProcessMap {
  if (!nodeById(map, nodeId)) {
    throw new MapOperationError("unknown-node", "That node is no longer in this map.");
  }
  return touch(
    {
      ...map,
      nodes: map.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              title: patch.title === undefined ? node.title : requireTitle(patch.title),
              description:
                patch.description === undefined ? node.description : patch.description.trim(),
              owner: patch.owner === undefined ? node.owner : patch.owner.trim(),
              system: patch.system === undefined ? node.system : patch.system.trim(),
              duration: patch.duration === undefined ? node.duration : patch.duration.trim(),
            }
          : node,
      ),
    },
    now,
  );
}

export function moveNode(
  map: ProcessMap,
  nodeId: string,
  position: FlowPosition,
  now: string,
): ProcessMap {
  if (!nodeById(map, nodeId)) {
    throw new MapOperationError("unknown-node", "That node is no longer in this map.");
  }
  return touch(
    {
      ...map,
      nodes: map.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node)),
    },
    now,
  );
}

export function duplicateNode(map: ProcessMap, nodeId: string, now: string): ProcessMap {
  const source = nodeById(map, nodeId);
  if (!source) {
    throw new MapOperationError("unknown-node", "That node is no longer in this map.");
  }
  const copy: FlowNode = {
    ...source,
    id: createId("node"),
    title: `${source.title} copy`,
    position: { x: source.position.x + 40, y: source.position.y + 40 },
    ...(source.kind === "step" ? { sipocOrder: nextStepOrder(map) } : {}),
  };
  return touch({ ...map, nodes: [...map.nodes, copy] }, now);
}

function reindexStepOrders(nodes: FlowNode[]): FlowNode[] {
  const steps = nodes
    .filter((node) => node.kind === "step")
    .sort((a, b) => (a.sipocOrder ?? 0) - (b.sipocOrder ?? 0));
  const order = new Map(steps.map((step, index) => [step.id, index + 1]));
  return nodes.map((node) =>
    node.kind === "step" ? { ...node, sipocOrder: order.get(node.id) } : node,
  );
}

export function removeNode(map: ProcessMap, nodeId: string, now: string): ProcessMap {
  const node = nodeById(map, nodeId);
  if (!node) {
    throw new MapOperationError("unknown-node", "That node is no longer in this map.");
  }
  if (node.kind === "step" && processSteps(map).length === 1) {
    // Allowed: an empty flow is a valid starting point.
  }
  return touch(
    {
      ...map,
      nodes: reindexStepOrders(map.nodes.filter((candidate) => candidate.id !== nodeId)),
      edges: map.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    },
    now,
  );
}

export function reorderSteps(
  map: ProcessMap,
  fromIndex: number,
  toIndex: number,
  now: string,
): ProcessMap {
  const steps = processSteps(map);
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= steps.length || toIndex >= steps.length) {
    throw new MapOperationError("invalid-order", "That position is outside the Process lane.");
  }
  if (fromIndex === toIndex) return map;
  const next = [...steps];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  const order = new Map(next.map((step, index) => [step.id, index + 1]));
  return touch(
    {
      ...map,
      nodes: map.nodes.map((node) =>
        node.kind === "step" ? { ...node, sipocOrder: order.get(node.id) } : node,
      ),
    },
    now,
  );
}

export interface ConnectionCheck {
  ok: boolean;
  reason?: string;
}

export function validateConnection(
  map: ProcessMap,
  source: string,
  target: string,
): ConnectionCheck {
  if (!nodeById(map, source) || !nodeById(map, target)) {
    return { ok: false, reason: "Both nodes must still exist." };
  }
  if (source === target) {
    return { ok: false, reason: "A node cannot connect to itself." };
  }
  const duplicate = map.edges.some((edge) => edge.source === source && edge.target === target);
  if (duplicate) {
    return { ok: false, reason: "These nodes are already connected." };
  }
  return { ok: true };
}

export interface AddEdgeInput {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  kind?: EdgeKind;
}

export function addEdge(map: ProcessMap, input: AddEdgeInput, now: string): ProcessMap {
  const check = validateConnection(map, input.source, input.target);
  if (!check.ok) {
    throw new MapOperationError(
      input.source === input.target ? "self-loop" : "duplicate-edge",
      check.reason ?? "That connection is not valid.",
    );
  }
  const edge: FlowEdge = {
    id: createId("edge"),
    source: input.source,
    target: input.target,
    label: input.label?.trim() ?? "",
    kind: input.kind ?? "flow",
    ...(input.sourceHandle ? { sourceHandle: input.sourceHandle } : {}),
    ...(input.targetHandle ? { targetHandle: input.targetHandle } : {}),
  };
  return touch({ ...map, edges: [...map.edges, edge] }, now);
}

export function updateEdge(
  map: ProcessMap,
  edgeId: string,
  patch: { label?: string; kind?: EdgeKind },
  now: string,
): ProcessMap {
  if (!edgeById(map, edgeId)) {
    throw new MapOperationError("unknown-edge", "That connection is no longer in this map.");
  }
  return touch(
    {
      ...map,
      edges: map.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              label: patch.label === undefined ? edge.label : patch.label.trim(),
              kind: patch.kind ?? edge.kind,
            }
          : edge,
      ),
    },
    now,
  );
}

export function removeEdge(map: ProcessMap, edgeId: string, now: string): ProcessMap {
  if (!edgeById(map, edgeId)) {
    throw new MapOperationError("unknown-edge", "That connection is no longer in this map.");
  }
  return touch({ ...map, edges: map.edges.filter((edge) => edge.id !== edgeId) }, now);
}

export function setViewport(map: ProcessMap, viewport: Viewport): ProcessMap {
  return { ...map, viewport };
}

interface CloneOptions {
  id: string;
  now: string;
  title?: string;
  description?: string;
  origin: ProcessMap["origin"];
  status?: MapStatus;
}

function cloneWithFreshIds(source: ProcessMap, options: CloneOptions): ProcessMap {
  const nodeIdMap = new Map<string, string>();
  const nodes = source.nodes.map((node) => {
    const id = createId("node");
    nodeIdMap.set(node.id, id);
    return { ...node, id, position: { ...node.position } };
  });
  const edges = source.edges.map((edge) => ({
    ...edge,
    id: createId("edge"),
    source: nodeIdMap.get(edge.source) ?? edge.source,
    target: nodeIdMap.get(edge.target) ?? edge.target,
  }));
  const remapLane = (entries: SipocEntry[]) =>
    entries.map((entry) => ({ ...entry, id: createId("entry") }));

  return {
    schemaVersion: SCHEMA_VERSION,
    id: options.id,
    title: requireTitle(options.title ?? source.title),
    description: options.description?.trim() || source.description,
    status: options.status ?? source.status,
    origin: options.origin,
    createdAt: options.now,
    updatedAt: options.now,
    sipoc: {
      suppliers: remapLane(source.sipoc.suppliers),
      inputs: remapLane(source.sipoc.inputs),
      outputs: remapLane(source.sipoc.outputs),
      customers: remapLane(source.sipoc.customers),
    },
    nodes,
    edges,
    viewport: { ...source.viewport },
  };
}

export function duplicateMap(
  source: ProcessMap,
  options: { id?: string; now: string; title?: string },
): ProcessMap {
  return cloneWithFreshIds(source, {
    id: options.id ?? createId("map"),
    now: options.now,
    title: options.title ?? `${source.title} copy`,
    origin: "duplicate",
  });
}

export function createMapFromTemplate(
  template: ProcessMap,
  options: { id?: string; now: string; title?: string; description?: string },
): ProcessMap {
  return cloneWithFreshIds(template, {
    id: options.id ?? createId("map"),
    now: options.now,
    title: options.title ?? template.title,
    description: options.description,
    origin: "template",
    status: "draft",
  });
}

export function importedTitle(title: string, existingTitles: string[]): string {
  if (!existingTitles.includes(title)) return title;
  let candidate = `${title} (imported)`;
  let version = 2;
  while (existingTitles.includes(candidate)) {
    candidate = `${title} (imported ${version})`;
    version += 1;
  }
  return candidate;
}

export function importMap(
  source: ProcessMap,
  options: { existingTitles: string[]; id?: string; now: string },
): ProcessMap {
  return cloneWithFreshIds(source, {
    id: options.id ?? createId("map"),
    now: options.now,
    title: importedTitle(source.title, options.existingTitles),
    origin: "import",
    status: "draft",
  });
}

export function createDemoWorkspaceCopy(maps: ProcessMap[], now: string): ProcessMap[] {
  return maps.map((map) => ({ ...map, updatedAt: now }));
}

export const ENTRY_LANE_ORDER = ENTRY_LANES;
export const SIPOC_LANE_ORDER = LANE_ORDER;
