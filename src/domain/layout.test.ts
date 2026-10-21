import { describe, expect, it } from "vitest";
import { tidyFlow } from "@/domain/layout";
import { addEdge, addNode, processSteps, updateNode } from "@/domain/operations";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW, makeMap } from "@/test/fixtures";

describe("tidy flow", () => {
  it("assigns finite positions to every seeded node and keeps SIPOC order", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const orders = new Map(processSteps(map).map((step) => [step.id, step.sipocOrder]));

    const tidy = tidyFlow(map, TEST_NOW);

    expect(tidy.nodes).toHaveLength(map.nodes.length);
    for (const node of tidy.nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
    for (const step of processSteps(tidy)) {
      expect(step.sipocOrder).toBe(orders.get(step.id));
    }
  });

  it("ranks nodes left to right by dependency", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const tidy = tidyFlow(map, TEST_NOW);
    const x = (id: string) => tidy.nodes.find((node) => node.id === id)?.position.x ?? 0;

    expect(x("support-node-start")).toBeLessThan(x("support-node-triage"));
    expect(x("support-node-triage")).toBeLessThan(x("support-node-decision"));
    expect(x("support-node-decision")).toBeLessThan(x("support-node-assign"));
    expect(x("support-node-resolve")).toBeLessThan(x("support-node-end"));
  });

  it("is deterministic for the same document", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const first = tidyFlow(map, TEST_NOW);
    const second = tidyFlow(map, TEST_NOW);
    expect(first.nodes.map((node) => node.position)).toEqual(
      second.nodes.map((node) => node.position),
    );
  });

  it("stacks disconnected components without dropping nodes", () => {
    let map = makeMap();
    map = addNode(map, { kind: "start", title: "Alpha" }, TEST_NOW);
    map = addNode(map, { kind: "start", title: "Beta" }, TEST_NOW);

    const tidy = tidyFlow(map, TEST_NOW);
    const ys = tidy.nodes.map((node) => node.position.y);

    expect(tidy.nodes).toHaveLength(2);
    expect(new Set(ys).size).toBe(2);
  });

  it("handles cycles without dropping nodes", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "One" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Two" }, TEST_NOW);
    const [one, two] = processSteps(map);
    map = addEdge(map, { source: two.id, target: one.id }, TEST_NOW);
    map = updateNode(map, one.id, { owner: "Owner" }, TEST_NOW);

    const tidy = tidyFlow(map, TEST_NOW);

    expect(tidy.nodes).toHaveLength(2);
    expect(tidy.edges).toHaveLength(2);
    for (const node of tidy.nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it("leaves an empty flow untouched", () => {
    const map = makeMap();
    const tidy = tidyFlow(map, TEST_NOW);
    expect(tidy.nodes).toEqual([]);
    expect(tidy.updatedAt).toBe(TEST_NOW);
  });
});
