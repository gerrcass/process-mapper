import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createSeededWorkspace } from "@/domain/templates";
import { encodeSharePayload } from "@/domain/share-link";
import { TEST_NOW } from "@/test/fixtures";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SharedMapView } from "./shared-map-view";

vi.mock("./static-flow-view", () => ({
  StaticFlowView: () => <div data-testid="static-flow" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function supportMap() {
  return structuredClone(createSeededWorkspace(TEST_NOW)[0]);
}

describe("shared map view", () => {
  it("renders the read-only snapshot for a valid payload", async () => {
    const map = supportMap();
    const payload = await encodeSharePayload(map);
    render(
      <TooltipProvider>
        <SharedMapView payload={payload} />
      </TooltipProvider>,
    );

    const details = within(await screen.findByRole("region", { name: "Map details" }));
    expect(details.getByRole("heading", { level: 1 })).toHaveTextContent(map.title);
    expect(details.getByText(map.description)).toBeInTheDocument();
    expect(details.getByText("Active")).toBeInTheDocument();

    const banner = screen.getByRole("note");
    expect(banner).toHaveTextContent(/Shared snapshot/i);
    expect(banner).toHaveTextContent(/Read-only/i);
    expect(banner).toHaveTextContent(/anyone with the link can read/i);

    for (const lane of ["Suppliers", "Inputs", "Process", "Outputs", "Customers"]) {
      expect(screen.getByRole("region", { name: lane })).toBeInTheDocument();
    }
    expect(
      within(screen.getByRole("region", { name: "Process" })).getByText("Triage the ticket"),
    ).toBeInTheDocument();

    expect(screen.getByText("Ready to share")).toBeInTheDocument();
    expect(await screen.findByTestId("static-flow")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Add supplier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add step" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("lists failed readiness checks with details and no fix actions", async () => {
    const map = supportMap();
    map.nodes = map.nodes.map((node) => (node.kind === "step" ? { ...node, owner: "" } : node));
    const payload = await encodeSharePayload(map);
    render(
      <TooltipProvider>
        <SharedMapView payload={payload} />
      </TooltipProvider>,
    );

    expect(await screen.findByText("Every step has an owner")).toBeInTheDocument();
    expect(screen.getByText("Nearly ready")).toBeInTheDocument();
    expect(screen.getByText("Name who is accountable for each step.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open Process/ })).not.toBeInTheDocument();
  });

  it("shows a specific reason and a way back for a broken payload", async () => {
    render(
      <TooltipProvider>
        <SharedMapView payload="u1.a!bc" />
      </TooltipProvider>,
    );

    expect(screen.getByLabelText("Reading share link")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: /This link cannot be read/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not valid base64/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to workspace/i })).toHaveAttribute("href", "/");
  });
});
