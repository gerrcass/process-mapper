import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { createBlankMap, processSteps } from "@/domain/operations";
import { TEST_NOW } from "@/test/fixtures";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SipocBoard } from "./sipoc-board";

function BoardHarness({
  mapId,
  onOpenFlow,
}: {
  mapId: string;
  onOpenFlow?: (nodeId: string) => void;
}) {
  const map = useWorkspace((state) => state.maps.find((candidate) => candidate.id === mapId));
  if (!map) return null;
  return <SipocBoard map={map} onOpenFlow={onOpenFlow} />;
}

function setup(mapId = "map-support-escalation", onOpenFlow?: (nodeId: string) => void) {
  render(
    <TooltipProvider>
      <BoardHarness mapId={mapId} onOpenFlow={onOpenFlow} />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useWorkspace.setState({
    maps: createSeededWorkspace(TEST_NOW),
    hydrated: true,
    past: [],
    future: [],
    storageError: null,
  });
});

function supplierLane() {
  return screen.getByRole("region", { name: "Suppliers" });
}

describe("SIPOC entry editing", () => {
  it("adds an entry inline and keeps capture moving", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Add supplier" }));
    await user.type(screen.getByLabelText("New supplier label"), "Procurement desk");
    await user.type(screen.getByLabelText("New supplier detail"), "Owns vendor checks");
    await user.click(screen.getByRole("button", { name: "Add supplier" }));

    const map = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === "map-support-escalation")!;
    expect(map.sipoc.suppliers).toHaveLength(5);
    expect(map.sipoc.suppliers[4]).toMatchObject({
      label: "Procurement desk",
      detail: "Owns vendor checks",
    });
    expect(screen.getByLabelText("New supplier label")).toHaveFocus();
    expect(within(supplierLane()).getByLabelText("5 entries")).toBeInTheDocument();
  });

  it("edits a label on Enter and reverts an edit on Escape", async () => {
    const user = userEvent.setup();
    setup();

    const label = screen.getByLabelText("Suppliers entry 1 label");
    await user.clear(label);
    await user.type(label, "Support queue");
    await user.keyboard("{Enter}");

    let map = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === "map-support-escalation")!;
    expect(map.sipoc.suppliers[0].label).toBe("Support queue");

    await user.clear(label);
    await user.type(label, "Temporary name");
    await user.keyboard("{Escape}");

    expect(label).toHaveValue("Support queue");
    map = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === "map-support-escalation")!;
    expect(map.sipoc.suppliers[0].label).toBe("Support queue");
  });

  it("clears an optional detail while keeping a required label", async () => {
    const user = userEvent.setup();
    setup();

    const detail = screen.getByLabelText("Suppliers entry 1 detail");
    await user.clear(detail);
    await user.keyboard("{Enter}");

    const map = supportMap();
    expect(map.sipoc.suppliers[0].detail).toBe("");
    expect(map.sipoc.suppliers[0].label).toBe("Support inbox");
  });

  it("rejects an empty label without writing to the map", async () => {
    const user = userEvent.setup();
    setup();

    const label = screen.getByLabelText("Suppliers entry 1 label");
    await user.clear(label);
    await user.keyboard("{Enter}");

    const map = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === "map-support-escalation")!;
    expect(map.sipoc.suppliers[0].label).toBe("Support inbox");
    expect(label).toHaveFocus();
    expect(label).toHaveValue("");
  });

  it("deletes an entry and moves focus to the add action", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Delete Support inbox" }));

    const map = useWorkspace
      .getState()
      .maps.find((candidate) => candidate.id === "map-support-escalation")!;
    expect(map.sipoc.suppliers.some((entry) => entry.label === "Support inbox")).toBe(false);
    await waitFor(() => expect(screen.getByRole("button", { name: "Add supplier" })).toHaveFocus());
  });

  it("reorders entries with the keyboard from the drag handle", async () => {
    const user = userEvent.setup();
    setup();

    const handle = screen.getByRole("button", {
      name: "Reorder suppliers entry 1: Support inbox",
    });
    handle.focus();
    await user.keyboard("{ArrowDown}");

    await waitFor(() => {
      const map = useWorkspace
        .getState()
        .maps.find((candidate) => candidate.id === "map-support-escalation")!;
      expect(map.sipoc.suppliers.map((entry) => entry.label)).toEqual([
        "On-call engineer rota",
        "Support inbox",
        "Customer success manager",
        "Incident commander pool",
      ]);
    });
  });

  it("shows realistic examples in an empty lane without storing them", async () => {
    const blank = createBlankMap({ id: "map-blank", title: "Blank", now: TEST_NOW });
    useWorkspace.setState({ maps: [blank] });
    setup("map-blank");

    const lane = within(supplierLane());
    expect(lane.getByText("Examples")).toBeInTheDocument();
    expect(lane.getByText("Support inbox")).toBeInTheDocument();
    expect(useWorkspace.getState().maps[0].sipoc.suppliers).toEqual([]);
  });
});

function processLane() {
  return screen.getByRole("region", { name: "Process" });
}

function supportMap() {
  return useWorkspace
    .getState()
    .maps.find((candidate) => candidate.id === "map-support-escalation")!;
}

describe("SIPOC process steps", () => {
  it("adds a step with the next SIPOC order and an edge from the last step", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(within(processLane()).getByRole("button", { name: "Add step" }));
    await user.type(screen.getByLabelText("New step title"), "Confirm the fix");
    await user.click(screen.getByRole("button", { name: "Add process step" }));

    const map = supportMap();
    const steps = processSteps(map);
    expect(steps).toHaveLength(5);
    expect(steps[4]).toMatchObject({ title: "Confirm the fix", sipocOrder: 5 });
    expect(
      map.edges.some((edge) => edge.source === steps[3].id && edge.target === steps[4].id),
    ).toBe(true);
    expect(screen.getByLabelText("New step title")).toHaveFocus();
    expect(within(processLane()).getByText("Confirm the fix")).toBeInTheDocument();
  });

  it("edits a step owner from the Process lane", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(within(processLane()).getAllByRole("button", { name: "Details" })[0]);
    const owner = screen.getByLabelText("Step 1 owner");
    await user.clear(owner);
    await user.type(owner, "Support director");
    await user.keyboard("{Enter}");

    expect(processSteps(supportMap())[0].owner).toBe("Support director");

    await user.click(within(processLane()).getByRole("button", { name: "Hide details" }));
    expect(within(processLane()).getByText("Support director")).toBeInTheDocument();
  });

  it("reorders steps with the keyboard without moving canvas positions", async () => {
    const user = userEvent.setup();
    setup();

    const before = supportMap();
    const positions = new Map(before.nodes.map((node) => [node.id, { ...node.position }]));
    const handle = screen.getByRole("button", {
      name: "Reorder step 1: Triage the ticket",
    });
    handle.focus();
    await user.keyboard("{ArrowDown}");

    await waitFor(() => {
      expect(processSteps(supportMap()).map((step) => step.title)).toEqual([
        "Assign an incident owner",
        "Triage the ticket",
        "Post the first customer update",
        "Resolve and capture the cause",
      ]);
    });
    expect(processSteps(supportMap()).map((step) => step.sipocOrder)).toEqual([1, 2, 3, 4]);
    for (const node of supportMap().nodes) {
      expect(node.position).toEqual(positions.get(node.id));
    }
  });

  it("deletes a step, cleans its edges, reindexes order, and recovers focus", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(within(processLane()).getAllByRole("button", { name: "Details" })[1]);
    await user.click(screen.getByRole("button", { name: "Delete step" }));

    const map = supportMap();
    expect(processSteps(map).map((step) => step.title)).toEqual([
      "Triage the ticket",
      "Post the first customer update",
      "Resolve and capture the cause",
    ]);
    expect(processSteps(map).map((step) => step.sipocOrder)).toEqual([1, 2, 3]);
    expect(
      map.edges.some(
        (edge) => edge.source === "support-node-assign" || edge.target === "support-node-assign",
      ),
    ).toBe(false);
    await waitFor(() =>
      expect(within(processLane()).getByRole("button", { name: "Add step" })).toHaveFocus(),
    );
  });

  it("jumps from a step card to its flow node", async () => {
    const user = userEvent.setup();
    const onOpenFlow = vi.fn();
    setup("map-support-escalation", onOpenFlow);

    await user.click(
      within(processLane()).getByRole("button", { name: "Open Triage the ticket in flow" }),
    );

    expect(onOpenFlow).toHaveBeenCalledWith("support-node-triage");
  });

  it("keeps start, decision, and end nodes out of the Process lane", () => {
    setup();
    const lane = within(processLane());
    expect(lane.queryByText("Priority 1 ticket arrives")).not.toBeInTheDocument();
    expect(lane.queryByText("Severity confirmed?")).not.toBeInTheDocument();
    expect(lane.queryByText("Escalation closed")).not.toBeInTheDocument();
  });
});
