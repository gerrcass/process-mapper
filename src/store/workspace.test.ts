import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspace, STORAGE_NAME } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { processSteps } from "@/domain/operations";
import { TEST_NOW } from "@/test/fixtures";

function resetStore() {
  window.localStorage.clear();
  useWorkspace.setState({
    maps: createSeededWorkspace(TEST_NOW),
    hydrated: true,
    storageError: null,
    past: [],
    future: [],
  });
}

describe("workspace store", () => {
  beforeEach(resetStore);

  it("creates a blank map and can undo and redo the creation", () => {
    const before = useWorkspace.getState().maps.length;
    const id = useWorkspace.getState().createMap({ title: "Returns process" });

    expect(id).toBeTruthy();
    expect(useWorkspace.getState().maps).toHaveLength(before + 1);
    expect(useWorkspace.getState().maps[0]).toMatchObject({
      title: "Returns process",
      status: "draft",
      origin: "blank",
    });

    useWorkspace.getState().undo();
    expect(useWorkspace.getState().maps).toHaveLength(before);

    useWorkspace.getState().redo();
    expect(useWorkspace.getState().maps).toHaveLength(before + 1);
  });

  it("creates a map from a template with its full frame and flow", () => {
    const id = useWorkspace.getState().createMap({
      title: "Escalation variant",
      templateId: "support-escalation",
    });
    const map = useWorkspace.getState().maps.find((candidate) => candidate.id === id);

    expect(map).toBeDefined();
    expect(map?.origin).toBe("template");
    expect(map?.status).toBe("draft");
    expect(processSteps(map!).length).toBeGreaterThanOrEqual(3);
    expect(map?.sipoc.customers.length).toBeGreaterThan(0);
  });

  it("updates title, description, and status and keeps them in the document", () => {
    const map = useWorkspace.getState().maps[0];
    useWorkspace.getState().updateDetails(map.id, {
      title: "Support escalation v2",
      description: "A revised purpose statement.",
      status: "archived",
    });

    const updated = useWorkspace.getState().maps.find((candidate) => candidate.id === map.id);
    expect(updated).toMatchObject({
      title: "Support escalation v2",
      description: "A revised purpose statement.",
      status: "archived",
    });

    useWorkspace.getState().undo();
    expect(useWorkspace.getState().maps.find((candidate) => candidate.id === map.id)?.title).toBe(
      map.title,
    );
  });

  it("duplicates a map with fresh identities", () => {
    const source = useWorkspace.getState().maps[0];
    const copyId = useWorkspace.getState().duplicateMap(source.id);
    const copy = useWorkspace.getState().maps.find((map) => map.id === copyId);

    expect(copyId).not.toBeNull();
    expect(copy?.title).toBe(`${source.title} copy`);
    expect(copy?.sipoc.suppliers[0].id).not.toBe(source.sipoc.suppliers[0].id);
    expect(copy?.nodes[0].id).not.toBe(source.nodes[0].id);
    expect(copy?.edges[0].source).toBe(
      copy?.nodes.find((node) => node.id === copy.edges[0].source)?.id,
    );
  });

  it("deletes a map and restores it with undo", () => {
    const source = useWorkspace.getState().maps[0];
    useWorkspace.getState().deleteMap(source.id);
    expect(useWorkspace.getState().maps.some((map) => map.id === source.id)).toBe(false);

    useWorkspace.getState().undo();
    expect(useWorkspace.getState().maps.some((map) => map.id === source.id)).toBe(true);
  });

  it("resets the demo to exactly the two seeded maps", () => {
    useWorkspace.getState().createMap({ title: "Temporary" });
    useWorkspace.getState().resetDemo();

    expect(useWorkspace.getState().maps.map((map) => map.id)).toEqual([
      "map-support-escalation",
      "map-new-hire-onboarding",
    ]);
  });

  it("imports a document with a fresh identity and a collision suffix", () => {
    const source = structuredClone(useWorkspace.getState().maps[0]);
    const importedId = useWorkspace.getState().importDocument(source);
    const imported = useWorkspace.getState().maps.find((map) => map.id === importedId);

    expect(imported?.title).toBe(`${source.title} (imported)`);
    expect(imported?.origin).toBe("import");
    expect(imported?.id).not.toBe(source.id);
    expect(imported?.nodes[0].id).not.toBe(source.nodes[0].id);
    expect(imported?.sipoc.inputs[0].id).not.toBe(source.sipoc.inputs[0].id);
  });

  it("adopts a shared snapshot with a fresh identity, draft status, and link origin", async () => {
    const snapshot = structuredClone(useWorkspace.getState().maps[0]);
    const before = useWorkspace.getState().maps;

    const adoptedId = await useWorkspace.getState().adoptDocument(snapshot);
    const adopted = useWorkspace.getState().maps.find((map) => map.id === adoptedId);

    expect(adopted).toBeDefined();
    expect(adopted?.origin).toBe("link");
    expect(adopted?.status).toBe("draft");
    expect(adopted?.id).not.toBe(snapshot.id);
    expect(adopted?.nodes[0].id).not.toBe(snapshot.nodes[0].id);
    expect(adopted?.edges[0].id).not.toBe(snapshot.edges[0].id);
    expect(adopted?.sipoc.suppliers[0].id).not.toBe(snapshot.sipoc.suppliers[0].id);
    expect(adopted?.edges[0].source).toBe(
      adopted?.nodes.find((node) => node.id === adopted.edges[0].source)?.id,
    );
    expect(adopted?.createdAt).toBe(adopted?.updatedAt);
    // Existing maps are untouched.
    expect(useWorkspace.getState().maps.slice(1)).toEqual(before);
  });

  it("names adopted maps so titles do not collide, even for the same snapshot", async () => {
    const snapshot = structuredClone(useWorkspace.getState().maps[0]);

    const firstId = await useWorkspace.getState().adoptDocument(snapshot);
    const secondId = await useWorkspace.getState().adoptDocument(snapshot);
    const first = useWorkspace.getState().maps.find((map) => map.id === firstId);
    const second = useWorkspace.getState().maps.find((map) => map.id === secondId);

    expect(firstId).not.toBe(secondId);
    expect(first?.title).toBe(`${snapshot.title} (imported)`);
    expect(second?.title).toBe(`${snapshot.title} (imported 2)`);
  });

  it("adopts a snapshot in one undoable history step", async () => {
    const snapshot = structuredClone(useWorkspace.getState().maps[0]);
    const before = useWorkspace.getState().maps;

    await useWorkspace.getState().adoptDocument(snapshot);

    expect(useWorkspace.getState().past).toHaveLength(1);
    useWorkspace.getState().undo();
    expect(useWorkspace.getState().maps).toEqual(before);
  });

  it("undoes and redoes across entry and step mutations", () => {
    const map = useWorkspace.getState().maps[0];
    useWorkspace.getState().addEntry(map.id, "suppliers", { label: "New supplier" });
    useWorkspace.getState().reorderStep(map.id, 0, 2);

    const afterEdits = useWorkspace.getState().maps.find((candidate) => candidate.id === map.id)!;
    expect(afterEdits.sipoc.suppliers.at(-1)?.label).toBe("New supplier");
    expect(processSteps(afterEdits)[2].title).toBe("Triage the ticket");

    useWorkspace.getState().undo();
    const afterUndoOne = useWorkspace.getState().maps.find((candidate) => candidate.id === map.id)!;
    expect(processSteps(afterUndoOne)[0].title).toBe("Triage the ticket");

    useWorkspace.getState().undo();
    const afterUndoTwo = useWorkspace.getState().maps.find((candidate) => candidate.id === map.id)!;
    expect(afterUndoTwo.sipoc.suppliers.some((entry) => entry.label === "New supplier")).toBe(
      false,
    );

    useWorkspace.getState().redo();
    const afterRedo = useWorkspace.getState().maps.find((candidate) => candidate.id === map.id)!;
    expect(afterRedo.sipoc.suppliers.some((entry) => entry.label === "New supplier")).toBe(true);
  });

  it("collapses a node drag into one undo step", () => {
    const map = useWorkspace.getState().maps[0];
    const step = processSteps(map)[0];
    useWorkspace.getState().beginNodeDrag();
    useWorkspace.getState().endNodeDrag(map.id, step.id, { x: 42, y: 84 });

    const moved = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === map.id)!
      .nodes.find((node) => node.id === step.id)!;
    expect(moved.position).toEqual({ x: 42, y: 84 });
    expect(useWorkspace.getState().past).toHaveLength(1);

    useWorkspace.getState().undo();
    const restored = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === map.id)!
      .nodes.find((node) => node.id === step.id)!;
    expect(restored.position).toEqual(step.position);
  });

  it("keeps viewport changes out of undo history", () => {
    const map = useWorkspace.getState().maps[0];
    useWorkspace.getState().setViewport(map.id, { x: 20, y: 30, zoom: 1.4 });

    expect(useWorkspace.getState().past).toHaveLength(0);
    expect(useWorkspace.getState().maps[0].viewport).toEqual({ x: 20, y: 30, zoom: 1.4 });
  });

  it("hydrates from a valid persisted payload", async () => {
    const seeded = createSeededWorkspace(TEST_NOW);
    const persisted = {
      ...seeded[0],
      title: "Persisted support map",
    };
    useWorkspace.setState({ maps: [], hydrated: false, past: [], future: [] });
    window.localStorage.setItem(
      STORAGE_NAME,
      JSON.stringify({ state: { maps: [persisted] }, version: 1 }),
    );

    await useWorkspace.persist.rehydrate();

    expect(useWorkspace.getState().maps).toHaveLength(1);
    expect(useWorkspace.getState().maps[0].title).toBe("Persisted support map");
    expect(useWorkspace.getState().hydrated).toBe(true);
  });

  it("falls back to seeds and keeps a backup when persisted data is invalid", async () => {
    useWorkspace.setState({
      maps: createSeededWorkspace(TEST_NOW),
      hydrated: false,
      past: [],
      future: [],
      storageError: null,
    });
    window.localStorage.setItem(
      STORAGE_NAME,
      JSON.stringify({ state: { maps: [{ title: "broken" }] }, version: 1 }),
    );

    await useWorkspace.persist.rehydrate();

    expect(useWorkspace.getState().maps).toHaveLength(2);
    expect(useWorkspace.getState().storageError).toContain("could not be read");
    expect(window.localStorage.getItem(`${STORAGE_NAME}.corrupt`)).toBeTruthy();
  });

  it("rejects a persisted payload from a newer schema without crashing", async () => {
    useWorkspace.setState({
      maps: createSeededWorkspace(TEST_NOW),
      hydrated: false,
      past: [],
      future: [],
      storageError: null,
    });
    window.localStorage.setItem(STORAGE_NAME, JSON.stringify({ state: { maps: [] }, version: 99 }));

    await useWorkspace.persist.rehydrate();

    expect(useWorkspace.getState().maps).toHaveLength(2);
    expect(useWorkspace.getState().hydrated).toBe(true);
    expect(useWorkspace.getState().storageError).toContain("newer than this app");
  });
});
