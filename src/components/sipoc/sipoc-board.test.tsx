import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { createBlankMap } from "@/domain/operations";
import { TEST_NOW } from "@/test/fixtures";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SipocBoard } from "./sipoc-board";

function BoardHarness({ mapId }: { mapId: string }) {
  const map = useWorkspace((state) => state.maps.find((candidate) => candidate.id === mapId));
  if (!map) return null;
  return <SipocBoard map={map} />;
}

function setup(mapId = "map-support-escalation") {
  render(
    <TooltipProvider>
      <BoardHarness mapId={mapId} />
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
