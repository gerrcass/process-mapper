import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW } from "@/test/fixtures";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dashboard } from "./dashboard";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "map-test" }),
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

describe("dashboard search", () => {
  it("filters by title and shows a distinct no-results state", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>,
    );

    expect(
      screen.getByRole("link", { name: "Open Customer support escalation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open New hire onboarding" })).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search maps" }), "onboarding");

    expect(
      screen.queryByRole("link", { name: "Open Customer support escalation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open New hire onboarding" })).toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "Search maps" }));
    await user.type(screen.getByRole("searchbox", { name: "Search maps" }), "payroll zebra");

    expect(screen.getByRole("heading", { name: /No maps match/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show all maps" })).toBeInTheDocument();
  });

  it("duplicates a map from the card menu and keeps it in the workspace", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Actions for Customer support escalation" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Duplicate map" }));

    expect(
      screen.getByRole("link", { name: "Open Customer support escalation copy" }),
    ).toBeInTheDocument();
    expect(useWorkspace.getState().maps).toHaveLength(3);
  });

  it("starts a new map from a gallery template with the title prefilled", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Use Purchase order approval template" }));

    expect(screen.getByRole("heading", { name: "New map" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Purchase order approval");
    expect(screen.getByRole("radio", { name: /Purchase order approval/ })).toBeChecked();
  });
});
