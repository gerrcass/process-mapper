import { SCHEMA_VERSION, type ProcessMap, type SipocEntry } from "./types";

const TEMPLATE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function entry(id: string, label: string, detail: string): SipocEntry {
  return { id, label, detail };
}

const supportEscalation: ProcessMap = {
  schemaVersion: SCHEMA_VERSION,
  id: "template-support-escalation",
  title: "Customer support escalation",
  description:
    "How a Priority 1 ticket moves from first contact to an accountable owner and a customer update.",
  status: "active",
  origin: "demo",
  createdAt: TEMPLATE_TIMESTAMP,
  updatedAt: TEMPLATE_TIMESTAMP,
  sipoc: {
    suppliers: [
      entry("support-sup-1", "Support inbox", "Shared queue in Zendesk"),
      entry("support-sup-2", "On-call engineer rota", "Weekly rotation across platform"),
      entry("support-sup-3", "Customer success manager", "Owns the account relationship"),
      entry("support-sup-4", "Incident commander pool", "Trained across support and engineering"),
    ],
    inputs: [
      entry("support-in-1", "Ticket with severity and account tier", "Captured at first contact"),
      entry("support-in-2", "Customer impact notes", "Who is affected and how work is blocked"),
      entry("support-in-3", "Service health signals", "Statuspage and monitoring alerts"),
      entry("support-in-4", "Contractual response window", "From the account support plan"),
    ],
    outputs: [
      entry("support-out-1", "Named incident owner", "One accountable person on the ticket"),
      entry("support-out-2", "Customer-facing update", "Plain-language status and next step"),
      entry("support-out-3", "Root-cause ticket", "Linked engineering investigation"),
      entry("support-out-4", "Post-incident review", "Scheduled within five working days"),
    ],
    customers: [
      entry("support-cus-1", "Reporting customer", "The team that raised the ticket"),
      entry("support-cus-2", "Account team", "Sales and success stakeholders"),
      entry("support-cus-3", "Support leadership", "Weekly escalation review"),
      entry("support-cus-4", "Engineering on-call", "Receives the root-cause ticket"),
    ],
  },
  nodes: [
    {
      id: "support-node-start",
      kind: "start",
      title: "Priority 1 ticket arrives",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 0, y: 200 },
    },
    {
      id: "support-node-triage",
      kind: "step",
      title: "Triage the ticket",
      description: "Confirm severity, account tier, and the response window before routing.",
      owner: "Support lead",
      system: "Zendesk",
      duration: "15 min",
      position: { x: 300, y: 180 },
      sipocOrder: 1,
    },
    {
      id: "support-node-decision",
      kind: "decision",
      title: "Severity confirmed?",
      description: "Use the severity matrix rather than the wording of the ticket.",
      owner: "",
      system: "",
      duration: "",
      position: { x: 620, y: 200 },
    },
    {
      id: "support-node-assign",
      kind: "step",
      title: "Assign an incident owner",
      description: "Name one owner in the ticket and hand off the paging context.",
      owner: "Incident commander",
      system: "PagerDuty",
      duration: "10 min",
      position: { x: 940, y: 180 },
      sipocOrder: 2,
    },
    {
      id: "support-node-update",
      kind: "step",
      title: "Post the first customer update",
      description: "State what is known, what is not, and when the next update lands.",
      owner: "Support lead",
      system: "Statuspage",
      duration: "20 min",
      position: { x: 1260, y: 180 },
      sipocOrder: 3,
    },
    {
      id: "support-node-resolve",
      kind: "step",
      title: "Resolve and capture the cause",
      description: "Close the customer loop and open a linked root-cause ticket.",
      owner: "On-call engineer",
      system: "Jira",
      duration: "1–2 days",
      position: { x: 1580, y: 180 },
      sipocOrder: 4,
    },
    {
      id: "support-node-end",
      kind: "end",
      title: "Escalation closed",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 1900, y: 200 },
    },
  ],
  edges: [
    {
      id: "support-edge-1",
      source: "support-node-start",
      target: "support-node-triage",
      label: "",
      kind: "flow",
    },
    {
      id: "support-edge-2",
      source: "support-node-triage",
      target: "support-node-decision",
      label: "",
      kind: "flow",
    },
    {
      id: "support-edge-3",
      source: "support-node-decision",
      target: "support-node-triage",
      label: "No, re-triage",
      kind: "exception",
    },
    {
      id: "support-edge-4",
      source: "support-node-decision",
      target: "support-node-assign",
      label: "Yes",
      kind: "flow",
    },
    {
      id: "support-edge-5",
      source: "support-node-assign",
      target: "support-node-update",
      label: "",
      kind: "flow",
    },
    {
      id: "support-edge-6",
      source: "support-node-update",
      target: "support-node-resolve",
      label: "",
      kind: "flow",
    },
    {
      id: "support-edge-7",
      source: "support-node-resolve",
      target: "support-node-end",
      label: "",
      kind: "flow",
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

const newHireOnboarding: ProcessMap = {
  schemaVersion: SCHEMA_VERSION,
  id: "template-new-hire-onboarding",
  title: "New hire onboarding",
  description:
    "The first-week path from a signed offer to a new teammate with accounts, context, and a plan.",
  status: "draft",
  origin: "demo",
  createdAt: TEMPLATE_TIMESTAMP,
  updatedAt: TEMPLATE_TIMESTAMP,
  sipoc: {
    suppliers: [
      entry("onboarding-sup-1", "Recruiter", "Hands over the signed offer"),
      entry("onboarding-sup-2", "Hiring manager", "Owns the role and first-week plan"),
      entry("onboarding-sup-3", "People operations", "Runs orientation and policy steps"),
      entry("onboarding-sup-4", "IT service desk", "Provisions accounts and equipment"),
    ],
    inputs: [
      entry("onboarding-in-1", "Signed offer letter", "Start date, level, and compensation"),
      entry("onboarding-in-2", "Role scorecard", "Outcomes for the first ninety days"),
      entry("onboarding-in-3", "Equipment request", "Laptop, access, and workspace needs"),
      entry("onboarding-in-4", "Start date and buddy assignment", "Confirmed one week ahead"),
    ],
    outputs: [
      entry("onboarding-out-1", "Provisioned accounts", "Email, chat, and role tools"),
      entry("onboarding-out-2", "First-week plan", "Meetings, reading, and a small deliverable"),
      entry("onboarding-out-3", "30-day check-in", "Scheduled with the hiring manager"),
      entry("onboarding-out-4", "Signed policy acknowledgements", "Stored in the people system"),
    ],
    customers: [
      entry("onboarding-cus-1", "New hire", "The person starting the role"),
      entry("onboarding-cus-2", "Hiring team", "Peers and the manager"),
      entry("onboarding-cus-3", "People operations", "Keeps records complete"),
      entry("onboarding-cus-4", "Payroll", "Needs a confirmed start date"),
    ],
  },
  nodes: [
    {
      id: "onboarding-node-start",
      kind: "start",
      title: "Offer signed",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 0, y: 200 },
    },
    {
      id: "onboarding-node-welcome",
      kind: "step",
      title: "Send the welcome note",
      description: "Confirm the start date, first-day contact, and what to bring.",
      owner: "People operations",
      system: "Gmail",
      duration: "1 day",
      position: { x: 300, y: 180 },
      sipocOrder: 1,
    },
    {
      id: "onboarding-node-provision",
      kind: "step",
      title: "Provision accounts and equipment",
      description: "Create the role accounts and ship the laptop before day one.",
      owner: "IT service desk",
      system: "Okta",
      duration: "2 days",
      position: { x: 620, y: 180 },
      sipocOrder: 2,
    },
    {
      id: "onboarding-node-decision",
      kind: "decision",
      title: "Equipment ready?",
      description: "Check the asset record before the new hire arrives.",
      owner: "",
      system: "",
      duration: "",
      position: { x: 940, y: 200 },
    },
    {
      id: "onboarding-node-orientation",
      kind: "step",
      title: "Run the first-day orientation",
      description: "Cover the team, the product, and the first small deliverable.",
      owner: "Hiring manager",
      system: "Notion",
      duration: "2 hours",
      position: { x: 1260, y: 180 },
      sipocOrder: 3,
    },
    {
      id: "onboarding-node-plan",
      kind: "step",
      title: "Set the 30-day plan",
      description: "Agree on three outcomes and the check-in cadence.",
      owner: "Hiring manager",
      system: "Lattice",
      duration: "45 min",
      position: { x: 1580, y: 180 },
      sipocOrder: 4,
    },
    {
      id: "onboarding-node-end",
      kind: "end",
      title: "First month complete",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 1900, y: 200 },
    },
  ],
  edges: [
    {
      id: "onboarding-edge-1",
      source: "onboarding-node-start",
      target: "onboarding-node-welcome",
      label: "",
      kind: "flow",
    },
    {
      id: "onboarding-edge-2",
      source: "onboarding-node-welcome",
      target: "onboarding-node-provision",
      label: "",
      kind: "flow",
    },
    {
      id: "onboarding-edge-3",
      source: "onboarding-node-provision",
      target: "onboarding-node-decision",
      label: "",
      kind: "flow",
    },
    {
      id: "onboarding-edge-4",
      source: "onboarding-node-decision",
      target: "onboarding-node-provision",
      label: "Not yet",
      kind: "exception",
    },
    {
      id: "onboarding-edge-5",
      source: "onboarding-node-decision",
      target: "onboarding-node-orientation",
      label: "Yes",
      kind: "flow",
    },
    {
      id: "onboarding-edge-6",
      source: "onboarding-node-orientation",
      target: "onboarding-node-plan",
      label: "",
      kind: "flow",
    },
    {
      id: "onboarding-edge-7",
      source: "onboarding-node-plan",
      target: "onboarding-node-end",
      label: "",
      kind: "flow",
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

const purchaseOrderApproval: ProcessMap = {
  schemaVersion: SCHEMA_VERSION,
  id: "template-purchase-order-approval",
  title: "Purchase order approval",
  description:
    "A straightforward path from a purchase request to an issued order, with a threshold-based approval stop.",
  status: "active",
  origin: "demo",
  createdAt: TEMPLATE_TIMESTAMP,
  updatedAt: TEMPLATE_TIMESTAMP,
  sipoc: {
    suppliers: [
      entry("po-sup-1", "Requesting team", "Raises the purchase request"),
      entry("po-sup-2", "Approved vendor list", "Procurement-maintained"),
      entry("po-sup-3", "Finance partner", "Checks budget and coding"),
    ],
    inputs: [
      entry("po-in-1", "Purchase request", "Scope, quantity, and vendor"),
      entry("po-in-2", "Budget line and cost centre", "Confirmed against the plan"),
      entry("po-in-3", "Vendor quote", "Valid for thirty days"),
    ],
    outputs: [
      entry("po-out-1", "Issued purchase order", "Sent to the vendor"),
      entry("po-out-2", "Approval record", "Stored with the request"),
      entry("po-out-3", "Budget commitment", "Visible in the finance system"),
    ],
    customers: [
      entry("po-cus-1", "Requesting team", "Waiting to order"),
      entry("po-cus-2", "Vendor", "Receives the order"),
      entry("po-cus-3", "Finance", "Tracks the commitment"),
    ],
  },
  nodes: [
    {
      id: "po-node-start",
      kind: "start",
      title: "Purchase request submitted",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 0, y: 180 },
    },
    {
      id: "po-node-check",
      kind: "step",
      title: "Check budget and vendor",
      description: "Confirm the vendor is approved and the cost centre has room.",
      owner: "Finance partner",
      system: "NetSuite",
      duration: "1 day",
      position: { x: 300, y: 160 },
      sipocOrder: 1,
    },
    {
      id: "po-node-decision",
      kind: "decision",
      title: "Above approval threshold?",
      description: "The threshold is set in the procurement policy.",
      owner: "",
      system: "",
      duration: "",
      position: { x: 620, y: 180 },
    },
    {
      id: "po-node-director",
      kind: "step",
      title: "Route to finance director",
      description: "Attach the quote and the budget line for a written decision.",
      owner: "Finance director",
      system: "Approval inbox",
      duration: "2 days",
      position: { x: 940, y: 160 },
      sipocOrder: 2,
    },
    {
      id: "po-node-issue",
      kind: "step",
      title: "Issue the purchase order",
      description: "Send the order and record the commitment against the budget.",
      owner: "Procurement lead",
      system: "Coupa",
      duration: "1 day",
      position: { x: 1260, y: 160 },
      sipocOrder: 3,
    },
    {
      id: "po-node-end",
      kind: "end",
      title: "Order issued",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 1580, y: 180 },
    },
  ],
  edges: [
    {
      id: "po-edge-1",
      source: "po-node-start",
      target: "po-node-check",
      label: "",
      kind: "flow",
    },
    {
      id: "po-edge-2",
      source: "po-node-check",
      target: "po-node-decision",
      label: "",
      kind: "flow",
    },
    {
      id: "po-edge-3",
      source: "po-node-decision",
      target: "po-node-director",
      label: "Yes",
      kind: "flow",
    },
    {
      id: "po-edge-4",
      source: "po-node-decision",
      target: "po-node-issue",
      label: "No",
      kind: "flow",
    },
    {
      id: "po-edge-5",
      source: "po-node-director",
      target: "po-node-issue",
      label: "",
      kind: "flow",
    },
    {
      id: "po-edge-6",
      source: "po-node-issue",
      target: "po-node-end",
      label: "",
      kind: "flow",
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export interface MapTemplate {
  id: string;
  name: string;
  summary: string;
  document: ProcessMap;
}

export const MAP_TEMPLATES: MapTemplate[] = [
  {
    id: "support-escalation",
    name: "Support escalation",
    summary: "Priority 1 ticket to named owner, customer update, and post-incident review.",
    document: supportEscalation,
  },
  {
    id: "new-hire-onboarding",
    name: "New hire onboarding",
    summary: "Signed offer to first-week plan across people, IT, and the hiring team.",
    document: newHireOnboarding,
  },
  {
    id: "purchase-order-approval",
    name: "Purchase order approval",
    summary: "Request, budget check, threshold approval, and issued order.",
    document: purchaseOrderApproval,
  },
];

export function templateById(id: string): MapTemplate | undefined {
  return MAP_TEMPLATES.find((template) => template.id === id);
}

function hoursBefore(now: string, hours: number): string {
  return new Date(new Date(now).getTime() - hours * 60 * 60 * 1000).toISOString();
}

export function createSeededWorkspace(now: string = new Date().toISOString()): ProcessMap[] {
  return [
    {
      ...supportEscalation,
      id: "map-support-escalation",
      origin: "demo",
      status: "active",
      createdAt: hoursBefore(now, 96),
      updatedAt: hoursBefore(now, 3),
      nodes: supportEscalation.nodes.map((node) => ({ ...node })),
      edges: supportEscalation.edges.map((edge) => ({ ...edge })),
      sipoc: {
        suppliers: supportEscalation.sipoc.suppliers.map((item) => ({ ...item })),
        inputs: supportEscalation.sipoc.inputs.map((item) => ({ ...item })),
        outputs: supportEscalation.sipoc.outputs.map((item) => ({ ...item })),
        customers: supportEscalation.sipoc.customers.map((item) => ({ ...item })),
      },
    },
    {
      ...newHireOnboarding,
      id: "map-new-hire-onboarding",
      origin: "demo",
      status: "draft",
      createdAt: hoursBefore(now, 72),
      updatedAt: hoursBefore(now, 26),
      nodes: newHireOnboarding.nodes.map((node) => ({ ...node })),
      edges: newHireOnboarding.edges.map((edge) => ({ ...edge })),
      sipoc: {
        suppliers: newHireOnboarding.sipoc.suppliers.map((item) => ({ ...item })),
        inputs: newHireOnboarding.sipoc.inputs.map((item) => ({ ...item })),
        outputs: newHireOnboarding.sipoc.outputs.map((item) => ({ ...item })),
        customers: newHireOnboarding.sipoc.customers.map((item) => ({ ...item })),
      },
    },
  ];
}

export const SUPPORT_MAP_ID = "map-support-escalation";
export const ONBOARDING_MAP_ID = "map-new-hire-onboarding";
