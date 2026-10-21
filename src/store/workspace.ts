import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import {
  addEdge,
  addEntry,
  addNode,
  createBlankMap,
  createMapFromTemplate,
  duplicateMap,
  duplicateNode,
  importMap,
  moveNode,
  nowIso,
  removeEdge,
  removeEntry,
  removeNode,
  reorderEntries,
  reorderSteps,
  setViewport as applyViewport,
  updateEdge,
  updateEntry,
  updateMapDetails,
  updateNode,
  validateEdge,
  type AddEdgeInput,
  type AddNodeInput,
  type FlowNodePatch,
  type MapDetailsPatch,
} from "@/domain/operations";
import { tidyFlow as tidyFlowLayout } from "@/domain/layout";
import { migratePersistedWorkspace } from "@/domain/schema";
import { createSeededWorkspace, templateById } from "@/domain/templates";
import { SCHEMA_VERSION } from "@/domain/types";
import { createId } from "@/lib/ids";
import type { EntryLane, FlowPosition, MapStatus, ProcessMap, Viewport } from "@/domain/types";

const STORAGE_NAME = "process-atlas.workspace";
const HISTORY_LIMIT = 50;

let dragSnapshot: ProcessMap[] | null = null;
let pendingStorageError: string | null = null;
let reportStorageError: (message: string) => void = () => {};

function rememberStorageError(message: string): void {
  pendingStorageError = message;
  reportStorageError(message);
}

export function takeStorageError(): string | null {
  const error = pendingStorageError;
  pendingStorageError = null;
  return error;
}

function quarantine(name: string, raw: string, reason: string): void {
  try {
    window.localStorage.setItem(`${name}.corrupt`, raw);
    window.localStorage.removeItem(name);
  } catch {
    // A full or blocked store leaves the payload in place; the app still falls back to seeds.
  }
  rememberStorageError(
    `Saved workspace could not be read: ${reason}. The demo maps were restored and the old payload was kept as a backup.`,
  );
}

const workspaceStorage: PersistStorage<{ maps: ProcessMap[] }> = {
  getItem(name): StorageValue<{ maps: ProcessMap[] }> | null {
    if (typeof window === "undefined") return null;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(name);
    } catch {
      rememberStorageError(
        "This browser is blocking local storage. Changes will last for this session only; export a map to keep a copy.",
      );
      return null;
    }
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      quarantine(name, raw, "the saved data is not valid JSON");
      return null;
    }

    const version =
      parsed && typeof parsed === "object" && "version" in parsed
        ? Number((parsed as { version: unknown }).version)
        : 0;
    const migrated = migratePersistedWorkspace(parsed, Number.isFinite(version) ? version : 0);
    if (!migrated.ok) {
      quarantine(name, raw, migrated.error);
      return null;
    }

    return { state: migrated.value, version: SCHEMA_VERSION };
  },

  setItem(name, value) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch {
      rememberStorageError(
        "Changes could not be saved to this browser. Export the map as JSON to keep a copy.",
      );
    }
  },

  removeItem(name) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Nothing useful to do when storage is unavailable.
    }
  },
};

export interface CreateMapInput {
  title: string;
  description?: string;
  templateId?: string;
}

export interface WorkspaceState {
  maps: ProcessMap[];
  hydrated: boolean;
  storageError: string | null;
  past: ProcessMap[][];
  future: ProcessMap[][];

  markHydrated: () => void;
  setStorageError: (message: string | null) => void;
  clearStorageError: () => void;

  createMap: (input: CreateMapInput) => string | null;
  updateDetails: (mapId: string, patch: MapDetailsPatch) => void;
  setStatus: (mapId: string, status: MapStatus) => void;
  duplicateMap: (mapId: string) => string | null;
  deleteMap: (mapId: string) => void;
  resetDemo: () => void;
  importDocument: (document: ProcessMap) => string | null;

  addEntry: (mapId: string, lane: EntryLane, input: { label: string; detail?: string }) => void;
  editEntry: (
    mapId: string,
    lane: EntryLane,
    entryId: string,
    patch: { label?: string; detail?: string },
  ) => void;
  deleteEntry: (mapId: string, lane: EntryLane, entryId: string) => void;
  reorderEntry: (mapId: string, lane: EntryLane, from: number, to: number) => void;

  addNode: (mapId: string, input: AddNodeInput) => string | null;
  editNode: (mapId: string, nodeId: string, patch: FlowNodePatch) => void;
  deleteNode: (mapId: string, nodeId: string) => void;
  copyNode: (mapId: string, nodeId: string) => string | null;
  moveNode: (mapId: string, nodeId: string, position: FlowPosition) => void;
  beginNodeDrag: () => void;
  endNodeDrag: (mapId: string, nodeId: string, position: FlowPosition) => void;
  reorderStep: (mapId: string, from: number, to: number) => void;

  connectNodes: (mapId: string, input: AddEdgeInput) => { ok: boolean; reason?: string };
  editEdge: (
    mapId: string,
    edgeId: string,
    patch: { label?: string; kind?: "flow" | "exception" },
  ) => void;
  deleteEdge: (mapId: string, edgeId: string) => void;

  tidyFlow: (mapId: string) => void;
  setViewport: (mapId: string, viewport: Viewport) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => {
      const applyMap = (
        mapId: string,
        updater: (map: ProcessMap) => ProcessMap,
        options: { record?: boolean } = {},
      ): ProcessMap | null => {
        const state = get();
        const current = state.maps.find((map) => map.id === mapId);
        if (!current) return null;
        const next = updater(current);
        if (next === current) return current;
        set({
          maps: state.maps.map((map) => (map.id === mapId ? next : map)),
          ...(options.record === false
            ? {}
            : { past: [...state.past, state.maps].slice(-HISTORY_LIMIT), future: [] }),
        });
        return next;
      };

      return {
        maps: createSeededWorkspace(),
        hydrated: false,
        storageError: null,
        past: [],
        future: [],

        markHydrated: () => set({ hydrated: true }),
        setStorageError: (message) => set({ storageError: message }),
        clearStorageError: () => set({ storageError: null }),

        createMap: (input) => {
          const state = get();
          const now = nowIso();
          const id = createId("map");
          const template = input.templateId ? templateById(input.templateId) : undefined;
          const map = template
            ? createMapFromTemplate(template.document, {
                id,
                now,
                title: input.title,
                description: input.description,
              })
            : createBlankMap({
                id,
                title: input.title,
                description: input.description,
                now,
              });
          set({
            maps: [map, ...state.maps],
            past: [...state.past, state.maps].slice(-HISTORY_LIMIT),
            future: [],
          });
          return id;
        },

        updateDetails: (mapId, patch) => {
          applyMap(mapId, (map) => updateMapDetails(map, patch, nowIso()));
        },

        setStatus: (mapId, status) => {
          applyMap(mapId, (map) => updateMapDetails(map, { status }, nowIso()));
        },

        duplicateMap: (mapId) => {
          const state = get();
          const source = state.maps.find((map) => map.id === mapId);
          if (!source) return null;
          const copy = duplicateMap(source, { id: createId("map"), now: nowIso() });
          set({
            maps: [copy, ...state.maps],
            past: [...state.past, state.maps].slice(-HISTORY_LIMIT),
            future: [],
          });
          return copy.id;
        },

        deleteMap: (mapId) => {
          const state = get();
          if (!state.maps.some((map) => map.id === mapId)) return;
          set({
            maps: state.maps.filter((map) => map.id !== mapId),
            past: [...state.past, state.maps].slice(-HISTORY_LIMIT),
            future: [],
          });
        },

        resetDemo: () => {
          const state = get();
          set({
            maps: createSeededWorkspace(),
            past: [...state.past, state.maps].slice(-HISTORY_LIMIT),
            future: [],
            storageError: null,
          });
        },

        importDocument: (document) => {
          const state = get();
          const imported = importMap(document, {
            existingTitles: state.maps.map((map) => map.title),
            id: createId("map"),
            now: nowIso(),
          });
          set({
            maps: [imported, ...state.maps],
            past: [...state.past, state.maps].slice(-HISTORY_LIMIT),
            future: [],
          });
          return imported.id;
        },

        addEntry: (mapId, lane, input) => {
          applyMap(mapId, (map) => addEntry(map, lane, input, nowIso()));
        },

        editEntry: (mapId, lane, entryId, patch) => {
          applyMap(mapId, (map) => updateEntry(map, lane, entryId, patch, nowIso()));
        },

        deleteEntry: (mapId, lane, entryId) => {
          applyMap(mapId, (map) => removeEntry(map, lane, entryId, nowIso()));
        },

        reorderEntry: (mapId, lane, from, to) => {
          applyMap(mapId, (map) => reorderEntries(map, lane, from, to, nowIso()));
        },

        addNode: (mapId, input) => {
          const current = get().maps.find((map) => map.id === mapId);
          if (!current) return null;
          const next = applyMap(mapId, (map) => {
            return { ...addNode(map, input, nowIso()) };
          });
          return (
            next?.nodes.find((node) => !current.nodes.some((item) => item.id === node.id))?.id ??
            null
          );
        },

        editNode: (mapId, nodeId, patch) => {
          applyMap(mapId, (map) => updateNode(map, nodeId, patch, nowIso()));
        },

        deleteNode: (mapId, nodeId) => {
          applyMap(mapId, (map) => removeNode(map, nodeId, nowIso()));
        },

        copyNode: (mapId, nodeId) => {
          const current = get().maps.find((map) => map.id === mapId);
          if (!current) return null;
          const next = applyMap(mapId, (map) => duplicateNode(map, nodeId, nowIso()));
          return (
            next?.nodes.find((node) => !current.nodes.some((item) => item.id === node.id))?.id ??
            null
          );
        },

        moveNode: (mapId, nodeId, position) => {
          applyMap(mapId, (map) => moveNode(map, nodeId, position, nowIso()));
        },

        beginNodeDrag: () => {
          dragSnapshot = get().maps;
        },

        endNodeDrag: (mapId, nodeId, position) => {
          const state = get();
          const current = state.maps.find((map) => map.id === mapId);
          if (!current) return;
          const node = current.nodes.find((item) => item.id === nodeId);
          if (!node) return;
          const unchanged =
            Math.abs(node.position.x - position.x) < 0.5 &&
            Math.abs(node.position.y - position.y) < 0.5;
          if (unchanged) {
            dragSnapshot = null;
            return;
          }
          const next = moveNode(current, nodeId, position, nowIso());
          const snapshot = dragSnapshot;
          set({
            maps: state.maps.map((map) => (map.id === mapId ? next : map)),
            past: snapshot ? [...state.past, snapshot].slice(-HISTORY_LIMIT) : state.past,
            future: snapshot ? [] : state.future,
          });
          dragSnapshot = null;
        },

        reorderStep: (mapId, from, to) => {
          applyMap(mapId, (map) => reorderSteps(map, from, to, nowIso()));
        },

        connectNodes: (mapId, input) => {
          const map = get().maps.find((candidate) => candidate.id === mapId);
          if (!map) return { ok: false, reason: "That map is no longer in the workspace." };
          const check = validateEdge(map, input.source, input.target);
          if (!check.ok) return check;
          applyMap(mapId, (current) => addEdge(current, input, nowIso()));
          return { ok: true };
        },

        editEdge: (mapId, edgeId, patch) => {
          applyMap(mapId, (map) => updateEdge(map, edgeId, patch, nowIso()));
        },

        deleteEdge: (mapId, edgeId) => {
          applyMap(mapId, (map) => removeEdge(map, edgeId, nowIso()));
        },

        tidyFlow: (mapId) => {
          applyMap(mapId, (map) => tidyFlowLayout(map, nowIso()));
        },

        setViewport: (mapId, viewport) => {
          applyMap(mapId, (map) => applyViewport(map, viewport), { record: false });
        },

        undo: () => {
          const state = get();
          const previous = state.past.at(-1);
          if (!previous) return;
          set({
            maps: previous,
            past: state.past.slice(0, -1),
            future: [state.maps, ...state.future].slice(0, HISTORY_LIMIT),
          });
        },

        redo: () => {
          const state = get();
          const next = state.future[0];
          if (!next) return;
          set({
            maps: next,
            past: [...state.past, state.maps].slice(-HISTORY_LIMIT),
            future: state.future.slice(1),
          });
        },

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,
      };
    },
    {
      name: STORAGE_NAME,
      version: SCHEMA_VERSION,
      storage: workspaceStorage,
      skipHydration: true,
      partialize: (state) => ({ maps: state.maps }),
      migrate: (persisted) => persisted as { maps: ProcessMap[] },
      onRehydrateStorage: () => (state) => {
        const error = takeStorageError();
        if (error) state?.setStorageError(error);
        state?.markHydrated();
      },
    },
  ),
);

reportStorageError = (message) => {
  useWorkspace.setState({ storageError: message });
};

export { STORAGE_NAME };
