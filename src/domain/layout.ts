import type { FlowNode, ProcessMap } from "./types";

const COLUMN_GAP = 320;
const ROW_GAP = 170;
const COMPONENT_GAP = 80;

const KIND_ORDER: Record<FlowNode["kind"], number> = {
  start: 0,
  step: 1,
  decision: 2,
  end: 3,
};

function componentsOf(nodes: FlowNode[], edges: ProcessMap["edges"]): FlowNode[][] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const neighbours = new Map<string, Set<string>>();
  for (const node of nodes) neighbours.set(node.id, new Set());
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    neighbours.get(edge.source)?.add(edge.target);
    neighbours.get(edge.target)?.add(edge.source);
  }

  const seen = new Set<string>();
  const components: FlowNode[][] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    const queue = [node.id];
    const component: FlowNode[] = [];
    seen.add(node.id);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const found = byId.get(current);
      if (found) component.push(found);
      for (const neighbour of neighbours.get(current) ?? []) {
        if (!seen.has(neighbour)) {
          seen.add(neighbour);
          queue.push(neighbour);
        }
      }
    }
    components.push(component);
  }
  return components;
}

function ranksFor(component: FlowNode[], edges: ProcessMap["edges"]): Map<string, number> {
  const ids = new Set(component.map((node) => node.id));
  const relevant = edges.filter(
    (edge) => ids.has(edge.source) && ids.has(edge.target) && edge.kind === "flow",
  );
  const ranks = new Map(component.map((node) => [node.id, 0]));

  // Longest-path ranks, bounded by the component size so cycles terminate.
  for (let pass = 0; pass < component.length; pass += 1) {
    let changed = false;
    for (const edge of relevant) {
      const candidate = (ranks.get(edge.source) ?? 0) + 1;
      if (candidate > (ranks.get(edge.target) ?? 0) && candidate <= component.length - 1) {
        ranks.set(edge.target, candidate);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const lowest = Math.min(...ranks.values());
  for (const [id, rank] of ranks) {
    ranks.set(id, rank - lowest);
  }
  return ranks;
}

function compareNodes(a: FlowNode, b: FlowNode): number {
  const kindDelta = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  if (kindDelta !== 0) return kindDelta;
  const orderDelta = (a.sipocOrder ?? 0) - (b.sipocOrder ?? 0);
  if (orderDelta !== 0) return orderDelta;
  const titleDelta = a.title.localeCompare(b.title);
  if (titleDelta !== 0) return titleDelta;
  return a.id.localeCompare(b.id);
}

/**
 * Deterministic layered layout: longest-path ranks, columns left to right,
 * disconnected components stacked vertically. Writes positions only.
 */
export function tidyFlow(map: ProcessMap, now: string): ProcessMap {
  if (map.nodes.length === 0) {
    return { ...map, updatedAt: now };
  }

  const components = componentsOf(map.nodes, map.edges).map((component) => ({
    nodes: component,
    ranks: ranksFor(component, map.edges),
  }));

  components.sort((a, b) => {
    const aMin = Math.min(...a.ranks.values());
    const bMin = Math.min(...b.ranks.values());
    if (aMin !== bMin) return aMin - bMin;
    const aOrder = Math.min(...a.nodes.map((node) => node.sipocOrder ?? Number.MAX_SAFE_INTEGER));
    const bOrder = Math.min(...b.nodes.map((node) => node.sipocOrder ?? Number.MAX_SAFE_INTEGER));
    if (aOrder !== bOrder) return aOrder - bOrder;
    return compareNodes(a.nodes[0], b.nodes[0]);
  });

  const positions = new Map<string, { x: number; y: number }>();
  let componentTop = 0;

  for (const component of components) {
    const byRank = new Map<number, FlowNode[]>();
    for (const node of component.nodes) {
      const rank = component.ranks.get(node.id) ?? 0;
      const bucket = byRank.get(rank) ?? [];
      bucket.push(node);
      byRank.set(rank, bucket);
    }
    const tallestColumn = Math.max(...[...byRank.values()].map((bucket) => bucket.length));

    for (const [rank, bucket] of [...byRank.entries()].sort((a, b) => a[0] - b[0])) {
      bucket.sort(compareNodes);
      bucket.forEach((node, index) => {
        positions.set(node.id, {
          x: rank * COLUMN_GAP,
          y: componentTop + index * ROW_GAP,
        });
      });
    }

    componentTop += Math.max(tallestColumn - 1, 0) * ROW_GAP + COMPONENT_GAP;
  }

  return {
    ...map,
    updatedAt: now,
    nodes: map.nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position,
    })),
  };
}
