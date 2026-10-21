import { describe, expect, it } from "vitest";
import { createSeededWorkspace, MAP_TEMPLATES, SUPPORT_MAP_ID } from "@/domain/templates";
import { evaluateReadiness } from "@/domain/readiness";
import { mapStats } from "@/domain/operations";
import { TEST_NOW } from "@/test/fixtures";

describe("seeded workspace", () => {
  it("contains two complete maps with stable identities", () => {
    const maps = createSeededWorkspace(TEST_NOW);
    expect(maps.map((map) => map.id)).toEqual([
      "map-support-escalation",
      "map-new-hire-onboarding",
    ]);
    expect(maps.every((map) => map.origin === "demo")).toBe(true);
    expect(new Set(maps.map((map) => map.id)).size).toBe(2);
  });

  it("gives each seeded map a complete five-lane frame and flow", () => {
    for (const map of createSeededWorkspace(TEST_NOW)) {
      const stats = mapStats(map);
      expect(stats.suppliers).toBeGreaterThanOrEqual(2);
      expect(stats.inputs).toBeGreaterThanOrEqual(2);
      expect(stats.outputs).toBeGreaterThanOrEqual(2);
      expect(stats.customers).toBeGreaterThanOrEqual(1);
      expect(stats.steps).toBeGreaterThanOrEqual(3);
      expect(map.nodes.some((node) => node.kind === "start")).toBe(true);
      expect(map.nodes.some((node) => node.kind === "end")).toBe(true);
    }
  });

  it("scores both seeded maps ready to share", () => {
    for (const map of createSeededWorkspace(TEST_NOW)) {
      expect(evaluateReadiness(map).score).toBe(100);
    }
  });

  it("offers three templates including the two seeded processes", () => {
    expect(MAP_TEMPLATES.map((template) => template.id)).toEqual([
      "support-escalation",
      "new-hire-onboarding",
      "purchase-order-approval",
    ]);
    expect(SUPPORT_MAP_ID).toBe("map-support-escalation");
  });
});
