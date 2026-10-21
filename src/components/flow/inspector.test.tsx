import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { processSteps } from "@/domain/operations";
import { TEST_NOW } from "@/test/fixtures";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SipocBoard } from "@/components/sipoc/sipoc-board";
import { Inspector } from "./inspector";

function supportMap() {
  return useWorkspace
    .getState()
    .maps.find((candidate) => candidate.id === "map-support-escalation")!;
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

describe("flow inspector", () => {
  it("shows the selected node's values and edits a step title through to SIPOC", async () => {
    const user = userEvent.setup();
    const map = supportMap();
    const step = processSteps(map)[0];
    render(
      <Inspector
        map={map}
        node={step}
        onClose={vi.fn()}
        onSelectNode={vi.fn()}
        onOpenSipoc={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Triage the ticket");
    expect(screen.getByRole("textbox", { name: "Owner" })).toHaveValue("Support lead");
    expect(screen.getByRole("textbox", { name: "System" })).toHaveValue("Zendesk");
    expect(screen.getByText("Step 01")).toBeInTheDocument();

    const title = screen.getByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Triage the incident");
    await user.keyboard("{Enter}");

    expect(processSteps(supportMap())[0].title).toBe("Triage the incident");

    render(
      <TooltipProvider>
        <SipocBoard map={supportMap()} />
      </TooltipProvider>,
    );
    const processLane = screen.getByRole("region", { name: "Process" });
    expect(within(processLane).getByDisplayValue("Triage the incident")).toBeInTheDocument();
  });

  it("duplicates a node and selects the copy", async () => {
    const user = userEvent.setup();
    const onSelectNode = vi.fn();
    const map = supportMap();
    const step = processSteps(map)[0];
    render(
      <Inspector
        map={map}
        node={step}
        onClose={vi.fn()}
        onSelectNode={onSelectNode}
        onOpenSipoc={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Duplicate" }));

    expect(processSteps(supportMap())).toHaveLength(5);
    expect(onSelectNode).toHaveBeenCalledTimes(1);
    expect(onSelectNode.mock.calls[0][0]).not.toBe(step.id);
  });

  it("edits an edge label and marks it as an exception", async () => {
    const user = userEvent.setup();
    const map = supportMap();
    const edge = map.edges.find((candidate) => candidate.label === "Yes")!;
    render(
      <Inspector
        map={map}
        edge={edge}
        onClose={vi.fn()}
        onSelectNode={vi.fn()}
        onOpenSipoc={vi.fn()}
      />,
    );

    const label = screen.getByRole("textbox", { name: "Label" });
    expect(label).toHaveValue("Yes");
    await user.clear(label);
    await user.type(label, "Approved");
    await user.keyboard("{Enter}");

    let updated = supportMap().edges.find((candidate) => candidate.id === edge.id)!;
    expect(updated.label).toBe("Approved");
    expect(updated.kind).toBe("flow");

    await user.click(screen.getByRole("radio", { name: /^Exception/ }));
    updated = supportMap().edges.find((candidate) => candidate.id === edge.id)!;
    expect(updated.kind).toBe("exception");
  });

  it("deletes a node and closes the inspector", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const map = supportMap();
    const step = processSteps(map)[0];
    render(
      <Inspector
        map={map}
        node={step}
        onClose={onClose}
        onSelectNode={vi.fn()}
        onOpenSipoc={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(processSteps(supportMap())).toHaveLength(3);
    expect(onClose).toHaveBeenCalled();
    expect(
      supportMap().edges.some((edge) => edge.source === step.id || edge.target === step.id),
    ).toBe(false);
  });
});
