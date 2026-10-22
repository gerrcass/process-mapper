import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW } from "@/test/fixtures";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorRoute } from "./editor-route";

const mocks = vi.hoisted(() => ({ searchParams: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mocks.searchParams,
  useParams: () => ({}),
}));

vi.mock("@/components/share/shared-map-view", () => ({
  SharedMapView: ({ payload }: { payload: string }) => (
    <div data-testid="shared-view" data-payload={payload} />
  ),
}));

function setup() {
  return render(
    <TooltipProvider>
      <EditorRoute />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  mocks.searchParams = new URLSearchParams();
  window.history.replaceState({}, "", "/maps");
  window.localStorage.clear();
  useWorkspace.setState({
    maps: createSeededWorkspace(TEST_NOW),
    hydrated: true,
    past: [],
    future: [],
    storageError: null,
  });
});

describe("editor route", () => {
  it("shows a stable skeleton until the fragment is read, then the empty state", async () => {
    setup();

    expect(screen.getByLabelText("Loading map")).toBeInTheDocument();
    expect(await screen.findByText("This map is not in this workspace.")).toBeInTheDocument();
  });

  it("opens the shared view for a share fragment", async () => {
    window.history.replaceState({}, "", "/maps#shared=u1.bm90IGpzb24");
    setup();

    const view = await screen.findByTestId("shared-view");
    expect(view).toHaveAttribute("data-payload", "u1.bm90IGpzb24");
  });

  it("keeps the query string reserved for the local editor", async () => {
    window.history.replaceState({}, "", "/maps#shared=u1.bm90IGpzb24");
    mocks.searchParams.set("map", "map-support-escalation");
    setup();

    expect(await screen.findByRole("textbox", { name: "Map title" })).toHaveValue(
      "Customer support escalation",
    );
    expect(screen.queryByTestId("shared-view")).not.toBeInTheDocument();
  });

  it("re-reads the fragment on hash navigation without a reload", async () => {
    window.history.replaceState({}, "", "/maps#shared=u1.bm90IGpzb24");
    setup();
    expect((await screen.findByTestId("shared-view")).dataset.payload).toBe("u1.bm90IGpzb24");

    window.location.hash = "#shared=u1.YWJjZA";
    await waitFor(() =>
      expect(screen.getByTestId("shared-view")).toHaveAttribute("data-payload", "u1.YWJjZA"),
    );

    window.location.hash = "#shared=";
    await waitFor(() =>
      expect(screen.getByTestId("shared-view")).toHaveAttribute("data-payload", ""),
    );
  });
});
