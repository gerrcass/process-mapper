import { addEdge, addEntry, addNode, createBlankMap, updateNode } from "@/domain/operations";
import type { ProcessMap } from "@/domain/types";

export const TEST_NOW = "2026-10-20T09:00:00.000Z";

export function makeMap(overrides: Partial<ProcessMap> = {}): ProcessMap {
  const base = createBlankMap({
    id: "map-test",
    title: "Test map",
    description: "A purpose statement long enough to count for readiness.",
    now: TEST_NOW,
  });
  return { ...base, ...overrides };
}

export function mapWithEntries(): ProcessMap {
  let map = makeMap();
  map = addEntry(map, "suppliers", { label: "Support inbox", detail: "Shared queue" }, TEST_NOW);
  map = addEntry(map, "suppliers", { label: "On-call engineer", detail: "Weekly rota" }, TEST_NOW);
  map = addEntry(map, "inputs", { label: "Ticket", detail: "Severity and account" }, TEST_NOW);
  map = addEntry(map, "outputs", { label: "Owner", detail: "Named on the ticket" }, TEST_NOW);
  map = addEntry(map, "customers", { label: "Reporting customer" }, TEST_NOW);
  return map;
}

export function mapWithSteps(count = 3): ProcessMap {
  let map = makeMap();
  for (let index = 1; index <= count; index += 1) {
    map = addNode(
      map,
      {
        kind: "step",
        title: `Step ${index}`,
        owner: "Owner",
        system: "System",
      },
      TEST_NOW,
    );
  }
  return map;
}

export function completeMap(): ProcessMap {
  let map = makeMap();
  map = addNode(map, { kind: "start", title: "Request arrives" }, TEST_NOW);
  map = addNode(
    map,
    { kind: "step", title: "Triage", owner: "Support lead", system: "Inbox" },
    TEST_NOW,
  );
  map = addNode(
    map,
    { kind: "step", title: "Assign", owner: "Incident commander", system: "Pager" },
    TEST_NOW,
  );
  map = addNode(
    map,
    { kind: "step", title: "Update", owner: "Support lead", system: "Status" },
    TEST_NOW,
  );
  map = addNode(map, { kind: "end", title: "Closed" }, TEST_NOW);
  map = addEntry(map, "suppliers", { label: "Support inbox" }, TEST_NOW);
  map = addEntry(map, "suppliers", { label: "On-call rota" }, TEST_NOW);
  map = addEntry(map, "inputs", { label: "Ticket" }, TEST_NOW);
  map = addEntry(map, "inputs", { label: "Impact notes" }, TEST_NOW);
  map = addEntry(map, "outputs", { label: "Named owner" }, TEST_NOW);
  map = addEntry(map, "outputs", { label: "Customer update" }, TEST_NOW);
  map = addEntry(map, "customers", { label: "Reporting customer" }, TEST_NOW);
  map = updateNode(
    map,
    map.nodes.find((node) => node.kind === "step")!.id,
    { owner: "Support lead" },
    TEST_NOW,
  );
  return map;
}

export function connectAll(map: ProcessMap): ProcessMap {
  let next = map;
  for (let index = 0; index < map.nodes.length - 1; index += 1) {
    next = addEdge(
      next,
      { source: map.nodes[index].id, target: map.nodes[index + 1].id },
      TEST_NOW,
    );
  }
  return next;
}
