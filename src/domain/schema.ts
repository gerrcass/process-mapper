import { z } from "zod";
import {
  EDGE_KINDS,
  ENTRY_LANES,
  FLOW_NODE_KINDS,
  MAP_ORIGINS,
  MAP_STATUSES,
  SCHEMA_VERSION,
  type ProcessMap,
  type SipocEntry,
} from "./types";

const isoDate = z.string().datetime({ offset: true });

const positionSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
  })
  .strict();

export const viewportSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    zoom: z.number().finite().min(0.05).max(8),
  })
  .strict();

const sipocEntrySchema = z
  .object({
    id: z.string().min(1),
    label: z.string().trim().min(1, "must not be empty"),
    detail: z.string(),
  })
  .strict();

const sipocSheetSchema = z
  .object({
    suppliers: z.array(sipocEntrySchema),
    inputs: z.array(sipocEntrySchema),
    outputs: z.array(sipocEntrySchema),
    customers: z.array(sipocEntrySchema),
  })
  .strict();

const flowNodeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(FLOW_NODE_KINDS),
    title: z.string().trim().min(1, "must not be empty"),
    description: z.string(),
    owner: z.string(),
    system: z.string(),
    duration: z.string(),
    position: positionSchema,
    sipocOrder: z.number().int().min(1).optional(),
  })
  .strict();

const flowEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().min(1).optional(),
    targetHandle: z.string().min(1).optional(),
    label: z.string(),
    kind: z.enum(EDGE_KINDS),
  })
  .strict();

export const processMapSchema = z
  .object({
    schemaVersion: z
      .number()
      .int()
      .refine((value) => value === SCHEMA_VERSION, `must be ${SCHEMA_VERSION} for this version`),
    id: z.string().min(1),
    title: z.string().trim().min(1, "must not be empty"),
    description: z.string(),
    status: z.enum(MAP_STATUSES),
    origin: z.enum(MAP_ORIGINS),
    createdAt: isoDate,
    updatedAt: isoDate,
    sipoc: sipocSheetSchema,
    nodes: z.array(flowNodeSchema),
    edges: z.array(flowEdgeSchema),
    viewport: viewportSchema,
  })
  .strict()
  .superRefine((map, ctx) => {
    const nodeIds = new Set<string>();
    map.nodes.forEach((node, index) => {
      if (nodeIds.has(node.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["nodes", index, "id"],
          message: `duplicate node id "${node.id}"`,
        });
      }
      nodeIds.add(node.id);

      if (node.kind === "step" && node.sipocOrder === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["nodes", index, "sipocOrder"],
          message: "is required for step nodes",
        });
      }
      if (node.kind !== "step" && node.sipocOrder !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["nodes", index, "sipocOrder"],
          message: "is only allowed on step nodes",
        });
      }
    });

    const orders = new Set<number>();
    map.nodes.forEach((node, index) => {
      if (node.kind !== "step" || node.sipocOrder === undefined) return;
      if (orders.has(node.sipocOrder)) {
        ctx.addIssue({
          code: "custom",
          path: ["nodes", index, "sipocOrder"],
          message: `duplicate SIPOC order ${node.sipocOrder}`,
        });
      }
      orders.add(node.sipocOrder);
    });

    const edgeIds = new Set<string>();
    map.edges.forEach((edge, index) => {
      if (edgeIds.has(edge.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["edges", index, "id"],
          message: `duplicate edge id "${edge.id}"`,
        });
      }
      edgeIds.add(edge.id);

      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: "custom",
          path: ["edges", index, "source"],
          message: `references unknown node "${edge.source}"`,
        });
      }
      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: "custom",
          path: ["edges", index, "target"],
          message: `references unknown node "${edge.target}"`,
        });
      }
      if (edge.source === edge.target) {
        ctx.addIssue({
          code: "custom",
          path: ["edges", index, "target"],
          message: "must not connect a node to itself",
        });
      }
    });
  });

export const persistedWorkspaceSchema = z
  .object({
    state: z
      .object({
        maps: z.array(processMapSchema),
      })
      .strict(),
    version: z.number().int().nonnegative(),
  })
  .strict();

export type PersistedWorkspace = {
  maps: ProcessMap[];
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function issuePath(path: PropertyKey[]): string {
  if (path.length === 0) return "document";
  return path
    .map((part, index) =>
      typeof part === "number" ? `[${part}]` : index === 0 ? String(part) : `.${String(part)}`,
    )
    .join("");
}

export function describeValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "the document is not valid";
  return `${issuePath(issue.path)} ${issue.message}`;
}

export function parseProcessMap(raw: unknown): ParseResult<ProcessMap> {
  const result = processMapSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: describeValidationError(result.error) };
  }
  return { ok: true, value: result.data };
}

export function parsePersistedWorkspace(raw: unknown): ParseResult<PersistedWorkspace> {
  const result = persistedWorkspaceSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: describeValidationError(result.error) };
  }
  if (result.data.version !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `workspace schema version ${result.data.version} is not supported`,
    };
  }
  return { ok: true, value: { maps: result.data.state.maps } };
}

/**
 * Kept beside the schema from day one. Future schema changes add real steps here;
 * today the migration is an identity function that still rejects unknown versions.
 */
export function migratePersistedWorkspace(
  raw: unknown,
  fromVersion: number,
): ParseResult<PersistedWorkspace> {
  if (fromVersion > SCHEMA_VERSION) {
    return { ok: false, error: `workspace schema version ${fromVersion} is newer than this app` };
  }
  return parsePersistedWorkspace(raw);
}

export function entryFromUnknown(raw: unknown): SipocEntry | null {
  const result = sipocEntrySchema.safeParse(raw);
  return result.success ? result.data : null;
}

export const laneSchema = z.enum(ENTRY_LANES);
