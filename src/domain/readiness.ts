import { processSteps } from "./operations";
import type { ProcessMap } from "./types";

export type ReadinessGroup = "frame" | "process" | "flow";
export type ReadinessView = "sipoc" | "flow";
export type ReadinessFocus = "suppliers" | "inputs" | "process" | "outputs" | "customers" | "flow";

export interface ReadinessCheck {
  id:
    | "purpose"
    | "suppliers"
    | "inputs"
    | "steps"
    | "owners"
    | "outputs"
    | "customers"
    | "connectivity"
    | "markers";
  group: ReadinessGroup;
  label: string;
  detail: string;
  passed: boolean;
  weight: number;
  view: ReadinessView;
  focus: ReadinessFocus;
  action: string;
}

export type ReadinessLevel = "Early draft" | "Nearly ready" | "Ready to share";

export interface Readiness {
  score: number;
  level: ReadinessLevel;
  checks: ReadinessCheck[];
  passed: number;
  total: number;
}

const GROUP_LABELS: Record<ReadinessGroup, string> = {
  frame: "Frame",
  process: "Process",
  flow: "Flow",
};

export function readinessGroupLabel(group: ReadinessGroup): string {
  return GROUP_LABELS[group];
}

export function evaluateReadiness(map: ProcessMap): Readiness {
  const steps = processSteps(map);
  const stepIds = new Set(steps.map((step) => step.id));
  const connectedStepIds = new Set<string>();
  for (const edge of map.edges) {
    if (stepIds.has(edge.source)) connectedStepIds.add(edge.source);
    if (stepIds.has(edge.target)) connectedStepIds.add(edge.target);
  }

  const checks: ReadinessCheck[] = [
    {
      id: "purpose",
      group: "frame",
      label: "Purpose is written",
      detail: "Describe what this process is for in one sentence.",
      passed: map.description.trim().length >= 20,
      weight: 10,
      view: "sipoc",
      focus: "process",
      action: "Edit map details",
    },
    {
      id: "suppliers",
      group: "frame",
      label: "Suppliers are named",
      detail: "Add at least two suppliers.",
      passed: map.sipoc.suppliers.length >= 2,
      weight: 10,
      view: "sipoc",
      focus: "suppliers",
      action: "Open Suppliers",
    },
    {
      id: "inputs",
      group: "frame",
      label: "Inputs are named",
      detail: "Add at least two inputs.",
      passed: map.sipoc.inputs.length >= 2,
      weight: 10,
      view: "sipoc",
      focus: "inputs",
      action: "Open Inputs",
    },
    {
      id: "steps",
      group: "process",
      label: "Process has three steps",
      detail: "A useful first draft has at least three process steps.",
      passed: steps.length >= 3,
      weight: 15,
      view: "sipoc",
      focus: "process",
      action: "Open Process",
    },
    {
      id: "owners",
      group: "process",
      label: "Every step has an owner",
      detail: "Name who is accountable for each step.",
      passed: steps.length > 0 && steps.every((step) => step.owner.trim().length > 0),
      weight: 15,
      view: "sipoc",
      focus: "process",
      action: "Open Process",
    },
    {
      id: "outputs",
      group: "process",
      label: "Outputs are named",
      detail: "Add at least two outputs.",
      passed: map.sipoc.outputs.length >= 2,
      weight: 10,
      view: "sipoc",
      focus: "outputs",
      action: "Open Outputs",
    },
    {
      id: "customers",
      group: "frame",
      label: "Customer is named",
      detail: "Add at least one customer.",
      passed: map.sipoc.customers.length >= 1,
      weight: 10,
      view: "sipoc",
      focus: "customers",
      action: "Open Customers",
    },
    {
      id: "connectivity",
      group: "flow",
      label: "Steps are connected",
      detail: "Every step needs at least one incoming or outgoing flow edge.",
      passed:
        steps.length > 0 &&
        (steps.length === 1 || steps.every((step) => connectedStepIds.has(step.id))),
      weight: 10,
      view: "flow",
      focus: "flow",
      action: "Open flow",
    },
    {
      id: "markers",
      group: "flow",
      label: "Start and end are marked",
      detail: "Add a start marker and an end marker to the flow.",
      passed:
        map.nodes.some((node) => node.kind === "start") &&
        map.nodes.some((node) => node.kind === "end"),
      weight: 10,
      view: "flow",
      focus: "flow",
      action: "Open flow",
    },
  ];

  const score = checks.reduce((total, check) => total + (check.passed ? check.weight : 0), 0);
  const passed = checks.filter((check) => check.passed).length;
  const level: ReadinessLevel =
    score === 100 ? "Ready to share" : score >= 70 ? "Nearly ready" : "Early draft";

  return { score, level, checks, passed, total: checks.length };
}
