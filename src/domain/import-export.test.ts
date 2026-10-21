import { describe, expect, it } from "vitest";
import {
  jsonFileName,
  parseMapFile,
  pngFileName,
  serializeMap,
  slugify,
} from "@/domain/import-export";
import { importedTitle, importMap } from "@/domain/operations";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW } from "@/test/fixtures";

describe("JSON import and export", () => {
  it("round-trips a document through the exported payload shape", () => {
    const map = createSeededWorkspace(TEST_NOW)[0];
    const payload = serializeMap(map);
    const parsed = JSON.parse(payload);

    expect(parsed).toMatchObject({
      schemaVersion: 1,
      id: map.id,
      title: map.title,
      status: map.status,
    });
    expect(parsed.sipoc.suppliers).toHaveLength(4);
    expect(parsed.nodes).toHaveLength(map.nodes.length);
    expect(parsed.edges).toHaveLength(map.edges.length);

    const result = parseMapFile(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.map).toEqual(map);
  });

  it("rejects malformed JSON with a specific message", () => {
    const result = parseMapFile("{not json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not valid JSON");
  });

  it("rejects a malformed document and names the failing field", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const payload = JSON.parse(serializeMap(map));
    payload.nodes[0].position.x = "left";

    const result = parseMapFile(JSON.stringify(payload));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("nodes[0].position.x");
      expect(result.error).toContain("Could not import this file");
    }
  });

  it("accepts a map wrapped in an export envelope", () => {
    const map = createSeededWorkspace(TEST_NOW)[0];
    const result = parseMapFile(JSON.stringify({ map, exportedAt: TEST_NOW }));
    expect(result.ok).toBe(true);
  });

  it("regenerates identity and appends a suffix on a title collision", () => {
    const map = createSeededWorkspace(TEST_NOW)[0];
    const imported = importMap(map, {
      existingTitles: [map.title],
      id: "map-imported",
      now: TEST_NOW,
    });

    expect(imported.title).toBe(`${map.title} (imported)`);
    expect(imported.id).toBe("map-imported");
    expect(imported.nodes[0].id).not.toBe(map.nodes[0].id);
    expect(imported.edges[0].source).toBe(
      imported.nodes.find((node) => node.id === imported.edges[0].source)?.id,
    );
  });

  it("keeps incrementing the suffix for repeated collisions", () => {
    expect(importedTitle("Support", ["Support", "Support (imported)"])).toBe(
      "Support (imported 2)",
    );
    expect(importedTitle("Support", ["Other"])).toBe("Support");
  });

  it("builds readable filenames", () => {
    const map = createSeededWorkspace(TEST_NOW)[0];
    expect(jsonFileName(map)).toBe("customer-support-escalation.process-atlas.json");
    expect(pngFileName(map)).toBe("customer-support-escalation-flow.png");
    expect(slugify("  New hire / onboarding  ")).toBe("new-hire-onboarding");
  });
});
