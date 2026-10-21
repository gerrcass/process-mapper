import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeededWorkspace } from "@/domain/templates";
import { processSteps } from "@/domain/operations";
import { TEST_NOW } from "@/test/fixtures";
import { ReadinessDialog } from "./readiness-dialog";

beforeEach(() => {
  window.localStorage.clear();
});

describe("readiness review dialog", () => {
  it("shows the score, grouped checks, and a failed check action", async () => {
    const user = userEvent.setup();
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    const step = processSteps(map)[0];
    map.nodes = map.nodes.map((node) => (node.id === step.id ? { ...node, owner: "" } : node));
    const onNavigate = vi.fn();

    render(<ReadinessDialog map={map} open onOpenChange={vi.fn()} onNavigate={onNavigate} />);

    expect(screen.getByRole("heading", { name: "Nearly ready" })).toBeInTheDocument();
    expect(screen.getByText("Every step has an owner")).toBeInTheDocument();
    expect(screen.getByText("Frame")).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    expect(screen.getByText("Flow")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open Process/ }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ id: "owners", view: "sipoc" });
  });

  it("shows all checks passing for the seeded support map", () => {
    const map = structuredClone(createSeededWorkspace(TEST_NOW)[0]);
    render(<ReadinessDialog map={map} open onOpenChange={vi.fn()} onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Ready to share" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open SIPOC|Open flow|Open Process/ })).toBeNull();
    expect(screen.getByText("Every step has an owner")).toBeInTheDocument();
  });
});
