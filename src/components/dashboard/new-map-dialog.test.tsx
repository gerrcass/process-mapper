import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspace } from "@/store/workspace";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW } from "@/test/fixtures";
import { NewMapDialog } from "./new-map-dialog";
import { mapHref } from "@/lib/routes";

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

describe("new map dialog", () => {
  it("requires a title before creating a map", async () => {
    const user = userEvent.setup();
    render(<NewMapDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Create map" }));

    expect(screen.getByRole("alert")).toHaveTextContent("A map title is required.");
    expect(push).not.toHaveBeenCalled();
    expect(useWorkspace.getState().maps).toHaveLength(2);
  });

  it("creates a map from a template and opens it", async () => {
    const user = userEvent.setup();
    render(<NewMapDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /Support escalation/ }));
    expect(screen.getByLabelText("Title")).toHaveValue("Support escalation");

    await user.type(screen.getByLabelText("Purpose"), "A second escalation path.");
    await user.click(screen.getByRole("button", { name: "Create map" }));

    const maps = useWorkspace.getState().maps;
    expect(maps).toHaveLength(3);
    const created = maps[0];
    expect(created.title).toBe("Support escalation");
    expect(created.origin).toBe("template");
    expect(created.description).toBe("A second escalation path.");
    expect(push).toHaveBeenCalledWith(mapHref(created.id));
  });

  it("creates a blank map when no template is chosen", async () => {
    const user = userEvent.setup();
    render(<NewMapDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Returns process");
    await user.click(screen.getByRole("button", { name: "Create map" }));

    const created = useWorkspace.getState().maps[0];
    expect(created).toMatchObject({ title: "Returns process", origin: "blank" });
    expect(created.nodes).toEqual([]);
  });
});
