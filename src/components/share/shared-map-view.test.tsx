import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { encodeSharePayload } from "@/domain/share-link";
import { TEST_NOW } from "@/test/fixtures";
import { mapHref } from "@/lib/routes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SharedMapView } from "./shared-map-view";

vi.mock("./static-flow-view", () => ({
  StaticFlowView: () => <div data-testid="static-flow" />,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
  useWorkspace.setState({
    maps: createSeededWorkspace(TEST_NOW),
    hydrated: true,
    past: [],
    future: [],
    storageError: null,
  });
});

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

  it("adopts the snapshot into the workspace and opens the editor on it", async () => {
    const user = userEvent.setup();
    const map = supportMap();
    const payload = await encodeSharePayload(map);
    render(
      <TooltipProvider>
        <SharedMapView payload={payload} />
      </TooltipProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Add to my workspace" }));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));

    const adopted = useWorkspace.getState().maps[0];
    expect(adopted.origin).toBe("link");
    expect(adopted.status).toBe("draft");
    expect(adopted.title).toBe(`${map.title} (imported)`);
    expect(adopted.id).not.toBe(map.id);
    expect(push).toHaveBeenCalledWith(mapHref(adopted.id));
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
