import { parseProcessMap, describeValidationError } from "./schema";
import type { ProcessMap } from "./types";
import { processMapSchema } from "./schema";

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

  const direct = parseProcessMap(raw);
  if (direct.ok) return { ok: true, map: direct.value };

  // A small compatibility affordance for exported workspace envelopes.
  if (raw && typeof raw === "object" && "map" in raw) {
    const candidate = (raw as { map: unknown }).map;
    const nested = parseProcessMap(candidate);
    if (nested.ok) return { ok: true, map: nested.value };
  }

  const result = processMapSchema.safeParse(raw);
  const detail = result.success
    ? "the document does not match a process map"
    : describeValidationError(result.error);
  return {
    ok: false,
    error: `Could not import this file: ${detail}.`,
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
