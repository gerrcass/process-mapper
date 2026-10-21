import { describe, expect, it } from "vitest";
import {
  MapOperationError,
  addEdge,
  addEntry,
  addNode,
  createBlankMap,
  duplicateMap,
  mapStats,
  moveNode,
  processSteps,
  removeEdge,
  removeEntry,
  removeNode,
  reorderEntries,
  reorderSteps,
  setViewport,
  updateEdge,
  updateEntry,
  updateMapDetails,
  updateNode,
  validateEdge,
} from "@/domain/operations";
import { TEST_NOW, makeMap } from "@/test/fixtures";

describe("SIPOC entries", () => {
  it("adds an entry with trimmed text", () => {
    const next = addEntry(
      makeMap(),
      "suppliers",
      { label: "  Support inbox  ", detail: " Queue " },
      TEST_NOW,
    );
    expect(next.sipoc.suppliers).toHaveLength(1);
    expect(next.sipoc.suppliers[0]).toMatchObject({ label: "Support inbox", detail: "Queue" });
    expect(next.updatedAt).toBe(TEST_NOW);
  });

  it("rejects an empty label", () => {
    expect(() => addEntry(makeMap(), "suppliers", { label: "  " }, TEST_NOW)).toThrow(
      MapOperationError,
    );
  });

  it("updates label and detail without touching other lanes", () => {
    const withEntry = addEntry(
      makeMap(),
      "customers",
      { label: "Customer", detail: "Detail" },
      TEST_NOW,
    );
    const id = withEntry.sipoc.customers[0].id;
    const next = updateEntry(withEntry, "customers", id, { label: "Account team" }, TEST_NOW);
    expect(next.sipoc.customers[0]).toMatchObject({ label: "Account team", detail: "Detail" });
    expect(next.sipoc.suppliers).toEqual([]);
  });

  it("removes an entry", () => {
    const withEntry = addEntry(makeMap(), "inputs", { label: "Ticket" }, TEST_NOW);
    const next = removeEntry(withEntry, "inputs", withEntry.sipoc.inputs[0].id, TEST_NOW);
    expect(next.sipoc.inputs).toEqual([]);
  });

  it("reorders entries within a lane", () => {
    let map = makeMap();
    map = addEntry(map, "outputs", { label: "A" }, TEST_NOW);
    map = addEntry(map, "outputs", { label: "B" }, TEST_NOW);
    map = addEntry(map, "outputs", { label: "C" }, TEST_NOW);
    const next = reorderEntries(map, "outputs", 0, 2, TEST_NOW);
    expect(next.sipoc.outputs.map((entry) => entry.label)).toEqual(["B", "C", "A"]);
  });

  it("treats an in-place reorder as a no-op and rejects out-of-range positions", () => {
    let map = makeMap();
    map = addEntry(map, "outputs", { label: "A" }, TEST_NOW);
    expect(reorderEntries(map, "outputs", 0, 0, TEST_NOW)).toBe(map);
    expect(() => reorderEntries(map, "outputs", 0, 4, TEST_NOW)).toThrow(MapOperationError);
  });
});

describe("flow nodes", () => {
  it("adds steps with contiguous SIPOC order and connects each new step to the last one", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "Triage" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Assign" }, TEST_NOW);

    const steps = processSteps(map);
    expect(steps.map((step) => step.sipocOrder)).toEqual([1, 2]);
    expect(map.edges).toHaveLength(1);
    expect(map.edges[0]).toMatchObject({ source: steps[0].id, target: steps[1].id, kind: "flow" });
    expect(steps[1].position.x).toBeGreaterThan(steps[0].position.x);
  });

  it("does not put SIPOC order on non-step nodes and does not auto-connect them", () => {
    let map = makeMap();
    map = addNode(map, { kind: "start", title: "Start" }, TEST_NOW);
    map = addNode(map, { kind: "decision", title: "Approved?" }, TEST_NOW);
    map = addNode(map, { kind: "end", title: "End" }, TEST_NOW);

    expect(map.nodes.every((node) => node.sipocOrder === undefined)).toBe(true);
    expect(map.edges).toEqual([]);
  });

  it("renames a step and updates the timestamp", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "Triage" }, TEST_NOW);
    const step = processSteps(map)[0];
    const next = updateNode(
      map,
      step.id,
      { title: "Triage the ticket", owner: "Support lead" },
      TEST_NOW,
    );
    expect(next.nodes[0]).toMatchObject({ title: "Triage the ticket", owner: "Support lead" });
  });

  it("reorders SIPOC steps without moving canvas positions", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "One" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Two" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Three" }, TEST_NOW);
    const positions = new Map(map.nodes.map((node) => [node.id, node.position]));

    const next = reorderSteps(map, 0, 2, TEST_NOW);

    expect(processSteps(next).map((step) => step.title)).toEqual(["Two", "Three", "One"]);
    expect(processSteps(next).map((step) => step.sipocOrder)).toEqual([1, 2, 3]);
    for (const node of next.nodes) {
      expect(node.position).toEqual(positions.get(node.id));
    }
  });

  it("deletes a step, its incident edges, and leaves contiguous SIPOC order", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "One" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Two" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Three" }, TEST_NOW);
    const middle = processSteps(map)[1];

    const next = removeNode(map, middle.id, TEST_NOW);

    expect(next.nodes.map((node) => node.title)).toEqual(["One", "Three"]);
    expect(processSteps(next).map((step) => step.sipocOrder)).toEqual([1, 2]);
    expect(next.edges.some((edge) => edge.source === middle.id || edge.target === middle.id)).toBe(
      false,
    );
  });

  it("moves a node without changing SIPOC order", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "One" }, TEST_NOW);
    const step = processSteps(map)[0];
    const next = moveNode(map, step.id, { x: 640, y: 120 }, TEST_NOW);
    expect(next.nodes[0].position).toEqual({ x: 640, y: 120 });
    expect(next.nodes[0].sipocOrder).toBe(1);
  });
});

describe("flow edges", () => {
  it("rejects self-loops and duplicate source/target pairs", () => {
    let map = makeMap();
    map = addNode(map, { kind: "start", title: "One" }, TEST_NOW);
    map = addNode(map, { kind: "end", title: "Two" }, TEST_NOW);
    const [one, two] = map.nodes;

    expect(validateEdge(map, one.id, one.id).ok).toBe(false);
    expect(() => addEdge(map, { source: one.id, target: one.id }, TEST_NOW)).toThrow(
      MapOperationError,
    );

    const connected = addEdge(map, { source: one.id, target: two.id }, TEST_NOW);
    expect(validateEdge(connected, one.id, two.id)).toMatchObject({ ok: false });
    expect(() => addEdge(connected, { source: one.id, target: two.id }, TEST_NOW)).toThrow(
      MapOperationError,
    );
  });

  it("labels an exception edge and updates its kind", () => {
    let map = makeMap();
    map = addNode(map, { kind: "decision", title: "Approved?" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Retry" }, TEST_NOW);
    const [decision, step] = map.nodes;
    map = addEdge(
      map,
      { source: decision.id, target: step.id, label: "No", kind: "exception" },
      TEST_NOW,
    );
    expect(map.edges[0]).toMatchObject({ label: "No", kind: "exception" });

    const next = updateEdge(map, map.edges[0].id, { label: "Not yet", kind: "flow" }, TEST_NOW);
    expect(next.edges[0]).toMatchObject({ label: "Not yet", kind: "flow" });
  });

  it("removes an edge", () => {
    let map = makeMap();
    map = addNode(map, { kind: "start", title: "One" }, TEST_NOW);
    map = addNode(map, { kind: "end", title: "Two" }, TEST_NOW);
    const [one, two] = map.nodes;
    map = addEdge(map, { source: one.id, target: two.id }, TEST_NOW);
    const next = removeEdge(map, map.edges[0].id, TEST_NOW);
    expect(next.edges).toEqual([]);
  });
});

describe("map lifecycle operations", () => {
  it("trims the title and rejects an empty one", () => {
    const next = updateMapDetails(makeMap(), { title: "  Support  " }, TEST_NOW);
    expect(next.title).toBe("Support");
    expect(() => updateMapDetails(makeMap(), { title: "   " }, TEST_NOW)).toThrow(
      MapOperationError,
    );
  });

  it("duplicates a map with fresh identities and a clear name", () => {
    let map = makeMap();
    map = addEntry(map, "suppliers", { label: "Support" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Triage" }, TEST_NOW);

    const copy = duplicateMap(map, { id: "map-copy", now: TEST_NOW });

    expect(copy.id).toBe("map-copy");
    expect(copy.title).toBe("Test map copy");
    expect(copy.sipoc.suppliers[0].id).not.toBe(map.sipoc.suppliers[0].id);
    expect(copy.nodes[0].id).not.toBe(map.nodes[0].id);
  });

  it("creates a blank map with an empty SIPOC sheet and no nodes", () => {
    const map = createBlankMap({ id: "map-new", title: "New map", now: TEST_NOW });
    expect(map.nodes).toEqual([]);
    expect(map.edges).toEqual([]);
    expect(map.sipoc).toEqual({ suppliers: [], inputs: [], outputs: [], customers: [] });
    expect(map.status).toBe("draft");
  });

  it("keeps viewport changes out of the updated timestamp", () => {
    const map = makeMap();
    const next = setViewport(map, { x: 12, y: -8, zoom: 1.2 });
    expect(next.viewport).toEqual({ x: 12, y: -8, zoom: 1.2 });
    expect(next.updatedAt).toBe(map.updatedAt);
  });

  it("reports lane and step counts", () => {
    let map = makeMap();
    map = addEntry(map, "suppliers", { label: "Support" }, TEST_NOW);
    map = addEntry(map, "customers", { label: "Team" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Triage" }, TEST_NOW);
    expect(mapStats(map)).toMatchObject({ suppliers: 1, customers: 1, entries: 2, steps: 1 });
  });
});
