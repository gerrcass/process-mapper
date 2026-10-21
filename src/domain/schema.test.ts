import { describe, expect, it } from "vitest";
import {
  describeValidationError,
  migratePersistedWorkspace,
  parsePersistedWorkspace,
  parseProcessMap,
  processMapSchema,
} from "@/domain/schema";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW } from "@/test/fixtures";

describe("process map schema", () => {
  it("accepts both seeded maps", () => {
    const maps = createSeededWorkspace(TEST_NOW);
    expect(maps).toHaveLength(2);
    for (const map of maps) {
      const result = processMapSchema.safeParse(map);
      expect(result.success, result.success ? "" : describeValidationError(result.error)).toBe(
        true,
      );
    }
  });

  it("rejects a node position that is not numeric", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    (map.nodes[0].position as { x: unknown }).x = "12";

    const result = parseProcessMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("nodes[0].position.x");
    }
  });

  it("rejects an edge that points at a missing node", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    map.edges[0].target = "missing-node";

    const result = parseProcessMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("references unknown node");
    }
  });

  it("requires SIPOC order on step nodes and forbids it elsewhere", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const step = map.nodes.find((node) => node.kind === "step");
    if (!step) throw new Error("seed is missing a step");
    delete step.sipocOrder;

    const result = parseProcessMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("sipocOrder");
  });

  it("rejects gaps in SIPOC order", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const steps = map.nodes.filter((node) => node.kind === "step");
    steps[1].sipocOrder = 7;

    const result = parseProcessMap(map);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("contiguously");
  });

  it("accepts a persisted workspace envelope and rejects an unknown version", () => {
    const maps = createSeededWorkspace(TEST_NOW);
    const payload = { state: { maps }, version: 1 };

    expect(parsePersistedWorkspace(payload).ok).toBe(true);

    const newer = parsePersistedWorkspace({ ...payload, version: 2 });
    expect(newer.ok).toBe(false);
    if (!newer.ok) expect(newer.error).toContain("version 2");
  });

  it("migrates the current schema as an identity function", () => {
    const maps = createSeededWorkspace(TEST_NOW);
    const result = migratePersistedWorkspace({ state: { maps }, version: 1 }, 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.maps).toHaveLength(2);
  });

  it("rejects a workspace from a newer app version", () => {
    const result = migratePersistedWorkspace({ state: { maps: [] }, version: 9 }, 9);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("newer than this app");
  });
});
