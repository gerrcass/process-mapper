import { describe, expect, it } from "vitest";
import { evaluateReadiness } from "@/domain/readiness";
import { createSeededWorkspace } from "@/domain/templates";
import { addNode, processSteps, removeEdge, removeNode } from "@/domain/operations";
import { TEST_NOW, makeMap } from "@/test/fixtures";

function seededSupport() {
  return structuredClone(createSeededWorkspace(TEST_NOW)[0]);
}

describe("readiness", () => {
  it("scores the seeded support map 100 with every check passing", () => {
    const readiness = evaluateReadiness(seededSupport());
    expect(readiness.score).toBe(100);
    expect(readiness.level).toBe("Ready to share");
    expect(readiness.checks).toHaveLength(9);
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
    expect(readiness.checks.reduce((total, check) => total + check.weight, 0)).toBe(100);
  });

  it("flips the owner check and subtracts exactly its weight", () => {
    const map = seededSupport();
    const step = processSteps(map)[0];
    map.nodes = map.nodes.map((node) => (node.id === step.id ? { ...node, owner: "" } : node));

    const readiness = evaluateReadiness(map);

    expect(readiness.score).toBe(85);
    expect(readiness.checks.find((check) => check.id === "owners")?.passed).toBe(false);
  });

  it("flips the outputs check when the lane is emptied", () => {
    const map = seededSupport();
    map.sipoc.outputs = [];

    const readiness = evaluateReadiness(map);

    expect(readiness.score).toBe(90);
    expect(readiness.checks.find((check) => check.id === "outputs")?.passed).toBe(false);
  });

  it.each([
    ["suppliers", "suppliers"],
    ["inputs", "inputs"],
    ["customers", "customers"],
  ] as const)("flips the %s check below its threshold", (checkId, lane) => {
    const map = seededSupport();
    map.sipoc[lane] = map.sipoc[lane].slice(0, lane === "customers" ? 0 : 1);

    const readiness = evaluateReadiness(map);

    expect(readiness.checks.find((check) => check.id === checkId)?.passed).toBe(false);
    if (lane === "customers") expect(readiness.score).toBe(90);
  });

  it("fails the step count below three steps", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "One", owner: "Owner" }, TEST_NOW);
    map = addNode(map, { kind: "step", title: "Two", owner: "Owner" }, TEST_NOW);

    const readiness = evaluateReadiness(map);

    expect(readiness.checks.find((check) => check.id === "steps")?.passed).toBe(false);
    expect(readiness.checks.find((check) => check.id === "owners")?.passed).toBe(true);
  });

  it("fails connectivity when a step has no incident edge", () => {
    const map = seededSupport();
    const step = processSteps(map)[1];
    for (const edge of map.edges.filter(
      (edge) => edge.source === step.id || edge.target === step.id,
    )) {
      map.edges = removeEdge(map, edge.id, TEST_NOW).edges;
    }

    const readiness = evaluateReadiness(map);

    expect(readiness.score).toBe(90);
    expect(readiness.checks.find((check) => check.id === "connectivity")?.passed).toBe(false);
  });

  it("treats a single-step map as connected", () => {
    let map = makeMap();
    map = addNode(map, { kind: "step", title: "Only step", owner: "Owner" }, TEST_NOW);

    const readiness = evaluateReadiness(map);

    expect(readiness.checks.find((check) => check.id === "connectivity")?.passed).toBe(true);
  });

  it("fails marker and purpose checks independently", () => {
    const map = seededSupport();
    const start = map.nodes.find((node) => node.kind === "start");
    if (!start) throw new Error("seed is missing a start node");
    map.nodes = removeNode(map, start.id, TEST_NOW).nodes;
    map.description = "Short.";

    const readiness = evaluateReadiness(map);

    expect(readiness.checks.find((check) => check.id === "markers")?.passed).toBe(false);
    expect(readiness.checks.find((check) => check.id === "purpose")?.passed).toBe(false);
    expect(readiness.score).toBe(80);
  });

  it("scores an empty map zero and stays advisory", () => {
    const readiness = evaluateReadiness(makeMap({ description: "" }));
    expect(readiness.score).toBe(0);
    expect(readiness.level).toBe("Early draft");
    expect(readiness.passed).toBe(0);
  });
});
