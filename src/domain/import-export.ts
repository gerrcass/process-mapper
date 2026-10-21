import { parseProcessMap } from "./schema";
import type { ProcessMap } from "./types";

export interface ImportResult {
  ok: boolean;
  map?: ProcessMap;
  error?: string;
}

export function serializeMap(map: ProcessMap): string {
  return JSON.stringify(map, null, 2);
}

export function parseMapFile(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Could not import this file: the file is not valid JSON." };
  }

  const result = parseProcessMap(raw);
  if (result.ok) return { ok: true, map: result.value };
  return {
    ok: false,
    error: `Could not import this file: ${result.error}.`,
  };
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "process-map"
  );
}

export function jsonFileName(map: ProcessMap): string {
  return `${slugify(map.title)}.process-atlas.json`;
}

export function pngFileName(map: ProcessMap): string {
  return `${slugify(map.title)}-flow.png`;
}
